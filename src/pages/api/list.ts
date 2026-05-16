import type { APIRoute } from "astro";
import { requirePermission, requireUserManager, type Resource } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";
import { editorMeta } from "~/lib/relative-time";
import { lucideSvg } from "~/lib/category-icons";

type Item = {
  id: string;
  title: string;
  subtitle: string | null;
  /** Optional third line (e.g. "Sebastián Ardila · hace 2 días").
   *  Renders muted under the subtitle. When `editorId` is set, the
   *  panel wraps the leading "Name" segment (everything before the
   *  first " · ") in a link to /admins/<editorId>. */
  meta?: string | null;
  /** uuid of the profile that last edited the row. */
  editorId?: string | null;
  status?: string | null;
  href: string;
  imageUrl?: string | null;
  /** "photo" → round, used for authors. "cover" → rectangular, used for books/articles.
   *  "emoji" → render `imageUrl` as a literal character/emoji.
   *  "icon"  → render `imageUrl` as a raw inline SVG (used for categories).
   *  "none"  → no thumb at all (used for orders, where there's no natural image). */
  imageStyle?: "photo" | "cover" | "emoji" | "icon" | "none";
  /** Categories: extra metadata used to render reorder controls. */
  reorderable?: boolean;
};

/** Activity label: "activo ahora" / "activo hace 2 h" / "activo hace 3 días" / "activo el 30 nov 2024". */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Date.now() - then;
  const sec = Math.floor(diffMs / 1000);
  // Activity heartbeat fires every ~5 min, so anything under that window
  // means the user is online right now.
  if (sec < 300) return "activo ahora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `activo hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `activo hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `activo hace ${day} día${day === 1 ? "" : "s"}`;
  const month = Math.floor(day / 30);
  if (month < 12) return `activo hace ${month} mes${month === 1 ? "" : "es"}`;
  const formatted = new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  return `activo el ${formatted}`;
}


// Orders isn't part of the per-user permissions matrix (gated by
// requireUserManager — owner+admin only), so we widen the union here.
type ListResource = Resource | "orders";
const ALLOWED = new Set<ListResource>([
  "posts",
  "books",
  "authors",
  "collaborators",
  "staff",
  "collections",
  "categories",
  "admins",
  "orders",
]);

// Legacy fallback emoji per category `kind`. Used only when a
// category hasn't been given a lucide icon yet. The `kind` column
// itself is no longer surfaced — categories now route purely by
// their association to books/posts.
const KIND_EMOJI: Record<string, string> = {
  philosophy: "✦",
  poetry: "❀",
  book: "❑",
  other: "◇",
};

export const GET: APIRoute = async (ctx) => {
  const url = new URL(ctx.request.url);
  const resource = url.searchParams.get("resource") as ListResource | null;

  if (!resource || !ALLOWED.has(resource)) {
    return new Response(JSON.stringify({ error: "invalid resource" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Orders has its own owner+admin gate; everything else routes
  // through the per-user permission matrix.
  if (resource === "orders") {
    const ord = await requireUserManager(ctx);
    if (ord instanceof Response) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  } else {
    const guard = await requirePermission(ctx, resource as Resource, "view");
    if (guard instanceof Response) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  let items: Item[] = [];

  if (resource === "posts") {
    // Disambiguate the FK: with the post_authors junction in place,
    // PostgREST has two paths from posts to authors and refuses to
    // embed without an explicit hint. We want the primary author from
    // posts.author_id for the list row, not the full junction.
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, status, updated_at, cover_image_url, authors!posts_author_id_fkey(name), editor:profiles!posts_updated_by_fkey(id, full_name, email)")
      .order("updated_at", { ascending: false });
    items = (data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      subtitle: p.authors?.name ?? p.slug,
      meta: editorMeta(p.updated_at, p.editor),
      editorId: p.editor?.id ?? null,
      status: p.status,
      href: `/posts/${p.id}`,
      imageUrl: p.cover_image_url ?? null,
      imageStyle: "cover",
    }));
  } else if (resource === "books") {
    // See note above for posts: the book_authors junction introduced
    // ambiguity in the books→authors relation, so we pin the FK.
    const { data } = await supabase
      .from("books")
      .select("id, title, slug, status, updated_at, cover_image_url, authors!books_author_id_fkey(name), editor:profiles!books_updated_by_fkey(id, full_name, email)")
      .order("updated_at", { ascending: false });
    items = (data ?? []).map((b: any) => ({
      id: b.id,
      title: b.title,
      subtitle: b.authors?.name ?? b.slug,
      meta: editorMeta(b.updated_at, b.editor),
      editorId: b.editor?.id ?? null,
      status: b.status,
      href: `/books/${b.id}`,
      imageUrl: b.cover_image_url ?? null,
      imageStyle: "cover",
    }));
  } else if (resource === "authors") {
    const { data } = await supabase
      .from("authors")
      .select("id, name, slug, photo_url, updated_at, editor:profiles!authors_updated_by_fkey(id, full_name, email)")
      .order("name");
    items = (data ?? []).map((a: any) => ({
      id: a.id,
      title: a.name,
      subtitle: `/${a.slug}`,
      meta: editorMeta(a.updated_at, a.editor),
      editorId: a.editor?.id ?? null,
      href: `/authors/${a.id}`,
      imageUrl: a.photo_url ?? null,
      imageStyle: "photo",
    }));
  } else if (resource === "collaborators") {
    // Mirror of authors. Same shape & FK pattern; lives in its own
    // table so editors can keep contributing roles (translator,
    // illustrator, prologue writer) separate from the canonical author.
    const { data } = await supabase
      .from("collaborators")
      .select("id, name, slug, photo_url, updated_at, editor:profiles!collaborators_updated_by_fkey(id, full_name, email)")
      .order("name");
    items = (data ?? []).map((a: any) => ({
      id: a.id,
      title: a.name,
      subtitle: `/${a.slug}`,
      meta: editorMeta(a.updated_at, a.editor),
      editorId: a.editor?.id ?? null,
      href: `/collaborators/${a.id}`,
      imageUrl: a.photo_url ?? null,
      imageStyle: "photo",
    }));
  } else if (resource === "collections") {
    // Editorial collections — groupings of books beyond category. The
    // subtitle shows the category name when set (so the editor can
    // distinguish "Poesía contemporánea" → Poesía from "Tomos de
    // filosofía" → Filosofía), or falls back to the slug.
    const { data } = await (supabase.from as any)("collections")
      .select("id, name, slug, cover_image_url, sort_order, status, updated_at, category:categories(name), editor:profiles!collections_updated_by_fkey(id, full_name, email)")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    items = (data ?? []).map((c: any) => ({
      id: c.id,
      title: c.name,
      subtitle: c.category?.name || `/${c.slug}`,
      meta: editorMeta(c.updated_at, c.editor),
      editorId: c.editor?.id ?? null,
      status: c.status,
      href: `/collections/${c.id}`,
      imageUrl: c.cover_image_url ?? null,
      imageStyle: "cover",
    }));
  } else if (resource === "staff") {
    // Organizational profiles — team members of Casa de Asterión.
    // Subtitle shows the role (cargo) so the editor can scan the
    // sidebar list and know who does what at a glance.
    const { data } = await supabase
      .from("staff")
      .select("id, name, slug, role, photo_url, sort_order, status, updated_at, editor:profiles!staff_updated_by_fkey(id, full_name, email)")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    items = (data ?? []).map((s: any) => ({
      id: s.id,
      title: s.name,
      subtitle: s.role || `/${s.slug}`,
      meta: editorMeta(s.updated_at, s.editor),
      editorId: s.editor?.id ?? null,
      status: s.status,
      href: `/staff/${s.id}`,
      imageUrl: s.photo_url ?? null,
      imageStyle: "photo",
    }));
  } else if (resource === "categories") {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, description, kind, icon, updated_at, editor:profiles!categories_updated_by_fkey(id, full_name, email)")
      .order("name");
    items = (data ?? []).map((c: any) => {
      // Prefer the user-picked lucide icon. Fall back to the kind-based
      // emoji character so old categories without an icon still render.
      const svg = lucideSvg(c.icon, { size: 18 });
      // Subtitle: short description if present, else the slug. The
      // legacy `kind` column is no longer surfaced.
      const subtitle = (c.description || "").trim() || `/${c.slug}`;
      return {
        id: c.id,
        title: c.name,
        subtitle,
        meta: editorMeta(c.updated_at, c.editor),
        editorId: c.editor?.id ?? null,
        href: `/categories/${c.id}`,
        imageUrl: svg ?? (KIND_EMOJI[c.kind] ?? KIND_EMOJI.other),
        imageStyle: svg ? "icon" as const : "emoji" as const,
        // Drag/reorder removed: with categories now driven by their
        // association to books/posts (and shown alphabetically as
        // filter chips), there's no editorial reason to pick a custom
        // order anymore.
        reorderable: false,
      };
    });
  } else if (resource === "orders") {
    // Pull the count of items per order in a single query via the
    // PostgREST aggregate. Sort by most recent first.
    const { data } = await supabase
      .from("purchase_intents")
      .select(
        "id, full_name, email, total_amount, currency, status, updated_at, items:purchase_intent_items(id), editor:profiles!purchase_intents_updated_by_fkey(id, full_name, email)",
      )
      .order("updated_at", { ascending: false });
    const formatMoney = (amount: number | null, currency: string) => {
      if (amount == null) return "—";
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: currency || "COP",
        maximumFractionDigits: 0,
      }).format(Number(amount));
    };
    items = (data ?? []).map((o: any) => {
      const count = Array.isArray(o.items) ? o.items.length : 0;
      const itemsLabel = count === 1 ? "1 libro" : `${count} libros`;
      return {
        id: o.id,
        title: o.full_name || o.email,
        // Subtitle bundles money + item count so the row tells a
        // complete story without needing to open the detail panel.
        subtitle: `${formatMoney(o.total_amount, o.currency)} · ${itemsLabel}`,
        meta: editorMeta(o.updated_at, o.editor),
        editorId: o.editor?.id ?? null,
        status: o.status,
        href: `/orders/${o.id}`,
        imageUrl: null,
        imageStyle: "none" as const,
      };
    });
  } else if (resource === "admins") {
    // Use the SECURITY DEFINER RPC so we can join auth.users.last_sign_in_at
    // (which lives in the protected auth schema). Sort client-side because
    // role text comparison would order them admin < editor < owner.
    const { data } = await supabase.rpc("list_cms_users");
    const ROLE_RANK: Record<string, number> = { owner: 0, admin: 1, editor: 2 };
    const sorted = (data ?? []).slice().sort((a: any, b: any) => {
      const rr = (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99);
      if (rr !== 0) return rr;
      return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email);
    });
    items = sorted.map((p: any) => {
      // Prefer last_active_at (touched on every authenticated request,
      // throttled). Fall back to last_sign_in_at for users who logged in
      // before activity tracking shipped.
      const ts = p.last_active_at ?? p.last_sign_in_at;
      return {
        id: p.id,
        title: p.full_name ?? p.email,
        subtitle: p.email,
        meta: ts ? formatRelative(ts) : "Nunca ha entrado",
        status: p.role,
        href: `/admins/${p.id}`,
        imageUrl: p.avatar_url ?? null,
        imageStyle: "photo",
      };
    });
  }

  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      // Don't cache — this is per-user authenticated data.
      "cache-control": "private, no-store",
    },
  });
};
