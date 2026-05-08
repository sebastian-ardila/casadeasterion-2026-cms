import type { APIContext } from "astro";
import { createHash } from "node:crypto";
import { getSupabaseServerClient } from "./supabase-server";

export type AdminUser = NonNullable<App.Locals["user"]>;

export type Resource = "posts" | "books" | "authors" | "categories" | "site" | "subscribers" | "admins";
export type Level = "none" | "view" | "edit";

/** A CMS account role. owner > admin > editor > viewer (no CMS access). */
export type CmsRole = "owner" | "admin" | "editor";

/** Resources whose permissions are configurable per-user (in admin_permissions). */
export const RESOURCES: Resource[] = ["posts", "books", "authors", "categories", "site", "subscribers", "admins"];

/** The configurable subset that admins/editors can have row-level overrides for. */
export const CONFIGURABLE_RESOURCES: Resource[] = ["posts", "books", "authors", "categories", "site"];

export const RESOURCE_LABEL: Record<Resource, string> = {
  posts: "Artículos",
  books: "Libros",
  authors: "Autores",
  categories: "Categorías",
  site: "Configuración",
  subscribers: "Suscriptores",
  admins: "Usuarios",
};

/** Defaults applied when an editor is created. Mirrors the SQL trigger. */
export const EDITOR_DEFAULT_PERMISSIONS: Record<Resource, Level> = {
  posts: "edit",
  books: "edit",
  authors: "edit",
  categories: "view",
  site: "none",
  subscribers: "none",
  admins: "none",
};

/** Defaults applied when an admin is created (everything edit). */
export const ADMIN_DEFAULT_PERMISSIONS: Record<Resource, Level> = {
  posts: "edit",
  books: "edit",
  authors: "edit",
  categories: "edit",
  site: "edit",
  subscribers: "none",
  admins: "none",
};

// ---------------------------------------------------------------------------
// In-memory caches.
//
// Each Lambda warm-instance shares its own cache. Cold-starts pay the full
// round trip; warm hits skip it. We're caching public-but-personal data
// (user profile, permission set) so the only safety question is staleness:
// after a user is granted/revoked a permission, the change takes up to TTL
// seconds to propagate. That's an acceptable tradeoff; users can refresh.
// ---------------------------------------------------------------------------

const TTL_MS = 30_000;
const MAX_ENTRIES = 1000;

type CacheEntry<T> = { value: T; expires: number };

class TinyCache<T> {
  private map = new Map<string, CacheEntry<T>>();
  get(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.expires < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return e.value;
  }
  set(key: string, value: T) {
    if (this.map.size >= MAX_ENTRIES) {
      // FIFO eviction: drop the oldest entry.
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
    this.map.set(key, { value, expires: Date.now() + TTL_MS });
  }
  invalidate(key: string) { this.map.delete(key); }
  clear() { this.map.clear(); }
}

const userCache = new TinyCache<AdminUser | null>();
const permsCache = new TinyCache<Record<Resource, Level>>();

// Track when we last bumped each user's last_active_at. We only write
// once every ACTIVITY_THROTTLE_MS per user so a chatty page doesn't fire
// an UPDATE on every request.
const ACTIVITY_THROTTLE_MS = 5 * 60_000;
const activityTouchedAt = new Map<string, number>();

// Derive a stable cache key from the request's Supabase auth cookies.
// We hash so we never log raw tokens.
function sessionKey(ctx: APIContext): string | null {
  const header = ctx.request.headers.get("cookie") ?? "";
  if (!header) return null;
  const sb = header
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c.startsWith("sb-"))
    .sort();
  if (sb.length === 0) return null;
  return createHash("sha256").update(sb.join("|")).digest("hex");
}

// Public helper: invalidate the caches for the current request, e.g. after
// granting/revoking a permission.
export function invalidateAuthCache(ctx: APIContext, userId?: string) {
  const k = sessionKey(ctx);
  if (k) userCache.invalidate(k);
  if (userId) permsCache.invalidate(userId);
}

export async function loadCurrentUser(ctx: APIContext): Promise<App.Locals["user"]> {
  const key = sessionKey(ctx);
  if (key) {
    const cached = userCache.get(key);
    if (cached !== undefined) return cached;
  }

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (key) userCache.set(key, null);
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  const result = (profile ?? null) as AdminUser | null;
  if (key) userCache.set(key, result);

  // Heartbeat: bump last_active_at, throttled per-user. Fire-and-forget so
  // it doesn't add latency to the request.
  if (result && (result.role === "owner" || result.role === "admin" || result.role === "editor")) {
    const last = activityTouchedAt.get(result.id) ?? 0;
    if (Date.now() - last >= ACTIVITY_THROTTLE_MS) {
      activityTouchedAt.set(result.id, Date.now());
      void supabase.rpc("touch_profile_activity").then(() => {}, () => {
        // Failed write → roll back the throttle so we'll try again sooner.
        activityTouchedAt.delete(result.id);
      });
    }
  }

  return result;
}

export function isCmsUser(user: App.Locals["user"]): user is AdminUser {
  return !!user && (user.role === "owner" || user.role === "admin" || user.role === "editor");
}

/** True if the user can manage other CMS users (create editors, etc.). */
export function isUserManager(user: App.Locals["user"]): user is AdminUser {
  return !!user && (user.role === "owner" || user.role === "admin");
}

export async function requireAdmin(ctx: APIContext): Promise<AdminUser | Response> {
  // Prefer the user the middleware already attached to locals — avoids a
  // second round trip when the page calls requireAdmin/requirePermission.
  const user = (ctx.locals as { user?: App.Locals["user"] }).user ?? await loadCurrentUser(ctx);
  if (!user) {
    return ctx.redirect(`/login?next=${encodeURIComponent(ctx.url.pathname)}`);
  }
  if (!isCmsUser(user)) {
    return ctx.redirect("/login?error=not_admin");
  }
  return user;
}

export async function requireOwner(ctx: APIContext): Promise<AdminUser | Response> {
  const guard = await requireAdmin(ctx);
  if (guard instanceof Response) return guard;
  if (guard.role !== "owner") {
    return ctx.redirect("/?error=owner_only");
  }
  return guard;
}

/** Page guard for the user-management area: owner OR admin (not editor). */
export async function requireUserManager(ctx: APIContext): Promise<AdminUser | Response> {
  const guard = await requireAdmin(ctx);
  if (guard instanceof Response) return guard;
  if (!isUserManager(guard)) {
    return ctx.redirect("/?error=no_permission&section=admins");
  }
  return guard;
}

/**
 * Returns the user's permission level for a given resource.
 * Reads from the cached permission set, so this is free after the first call
 * within a request lifetime.
 */
export async function getPermission(
  ctx: APIContext,
  user: AdminUser,
  resource: Resource,
): Promise<Level> {
  const all = await getAllPermissions(ctx, user);
  return all[resource];
}

export async function getAllPermissions(
  ctx: APIContext,
  user: AdminUser,
): Promise<Record<Resource, Level>> {
  const cached = permsCache.get(user.id);
  if (cached) return cached;

  const out: Record<Resource, Level> = {
    posts: "none", books: "none", authors: "none", categories: "none",
    site: "none", subscribers: "none", admins: "none",
  };
  if (user.role === "owner") {
    for (const r of RESOURCES) out[r] = "edit";
    permsCache.set(user.id, out);
    return out;
  }
  if (user.role !== "admin" && user.role !== "editor") {
    permsCache.set(user.id, out);
    return out;
  }
  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { data } = await supabase
    .from("admin_permissions")
    .select("resource, level")
    .eq("profile_id", user.id);
  for (const row of data ?? []) {
    if ((RESOURCES as string[]).includes(row.resource)) {
      out[row.resource as Resource] = row.level as Level;
    }
  }
  // Role-derived permissions: subscribers + admins (user management) are
  // not stored per-row. They come straight from the role.
  out.subscribers = user.role === "owner" ? "edit" : "none";
  out.admins      = user.role === "owner" || user.role === "admin" ? "edit" : "none";
  permsCache.set(user.id, out);
  return out;
}

const LEVEL_ORDER: Record<Level, number> = { none: 0, view: 1, edit: 2 };

export function levelMeets(actual: Level, required: Level): boolean {
  return LEVEL_ORDER[actual] >= LEVEL_ORDER[required];
}

/**
 * Page guard: requires the user to have at least `required` permission on `resource`.
 * Returns either { user, permission } or a Response (redirect).
 */
export async function requirePermission(
  ctx: APIContext,
  resource: Resource,
  required: Exclude<Level, "none">,
): Promise<{ user: AdminUser; permission: Level } | Response> {
  const guard = await requireAdmin(ctx);
  if (guard instanceof Response) return guard;
  const permission = await getPermission(ctx, guard, resource);
  if (!levelMeets(permission, required)) {
    return ctx.redirect("/?error=no_permission&section=" + resource);
  }
  return { user: guard, permission };
}
