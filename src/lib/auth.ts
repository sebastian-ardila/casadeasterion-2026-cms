import type { APIContext } from "astro";
import { getSupabaseServerClient } from "./supabase-server";

export type AdminUser = NonNullable<App.Locals["user"]>;

export type Resource = "posts" | "books" | "authors" | "categories" | "site";
export type Level = "none" | "view" | "edit";

export const RESOURCES: Resource[] = ["posts", "books", "authors", "categories", "site"];

export const RESOURCE_LABEL: Record<Resource, string> = {
  posts: "Artículos",
  books: "Libros",
  authors: "Autores",
  categories: "Categorías",
  site: "Configuración",
};

export async function loadCurrentUser(ctx: APIContext): Promise<App.Locals["user"]> {
  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return profile as AdminUser;
}

export function isCmsUser(user: App.Locals["user"]): user is AdminUser {
  return !!user && (user.role === "owner" || user.role === "admin");
}

export async function requireAdmin(ctx: APIContext): Promise<AdminUser | Response> {
  const user = await loadCurrentUser(ctx);
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

/**
 * Returns the user's permission level for a given resource.
 * - owner: always 'edit'
 * - admin: looked up in admin_permissions, defaults to 'none' if no row
 * - other roles: 'none'
 */
export async function getPermission(
  ctx: APIContext,
  user: AdminUser,
  resource: Resource,
): Promise<Level> {
  if (user.role === "owner") return "edit";
  if (user.role !== "admin") return "none";
  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { data } = await supabase
    .from("admin_permissions")
    .select("level")
    .eq("profile_id", user.id)
    .eq("resource", resource)
    .maybeSingle();
  return (data?.level ?? "none") as Level;
}

export async function getAllPermissions(
  ctx: APIContext,
  user: AdminUser,
): Promise<Record<Resource, Level>> {
  const out: Record<Resource, Level> = {
    posts: "none",
    books: "none",
    authors: "none",
    categories: "none",
    site: "none",
  };
  if (user.role === "owner") {
    for (const r of RESOURCES) out[r] = "edit";
    return out;
  }
  if (user.role !== "admin") return out;
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
