import type { APIRoute } from "astro";
import { requirePermission, type Resource } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

type Item = {
  id: string;
  title: string;
  subtitle: string | null;
  /** Optional third line (e.g. "hace 2 días"). Renders muted under the subtitle. */
  meta?: string | null;
  status?: string | null;
  href: string;
  imageUrl?: string | null;
  /** "photo" → round, used for authors. "cover" → rectangular, used for books/articles.
   *  "emoji" → render `imageUrl` as a literal character/emoji (used for categories). */
  imageStyle?: "photo" | "cover" | "emoji";
  /** Categories: extra metadata used to render reorder controls. */
  reorderable?: boolean;
};

/** "hace 5 minutos" / "hace 3 días" / "hace 2 meses" / "30 nov 2024". */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Date.now() - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "ahora mismo";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `hace ${day} día${day === 1 ? "" : "s"}`;
  const month = Math.floor(day / 30);
  if (month < 12) return `hace ${month} mes${month === 1 ? "" : "es"}`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

type ListResource = Resource;
const ALLOWED = new Set<ListResource>(["posts", "books", "authors", "categories", "admins"]);

const KIND_EMOJI: Record<string, string> = {
  philosophy: "✦",
  poetry: "❀",
  book: "❑",
  other: "◇",
};
const KIND_LABEL: Record<string, string> = {
  philosophy: "Filosofía",
  poetry: "Poesía",
  book: "Libro",
  other: "Otro",
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

  const guard = await requirePermission(ctx, resource, "view");
  if (guard instanceof Response) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  let items: Item[] = [];

  if (resource === "posts") {
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, status, updated_at, cover_image_url, authors(name)")
      .order("updated_at", { ascending: false });
    items = (data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      subtitle: p.authors?.name ?? p.slug,
      status: p.status,
      href: `/posts/${p.id}`,
      imageUrl: p.cover_image_url ?? null,
      imageStyle: "cover",
    }));
  } else if (resource === "books") {
    const { data } = await supabase
      .from("books")
      .select("id, title, slug, status, updated_at, cover_image_url, authors(name)")
      .order("updated_at", { ascending: false });
    items = (data ?? []).map((b: any) => ({
      id: b.id,
      title: b.title,
      subtitle: b.authors?.name ?? b.slug,
      status: b.status,
      href: `/books/${b.id}`,
      imageUrl: b.cover_image_url ?? null,
      imageStyle: "cover",
    }));
  } else if (resource === "authors") {
    const { data } = await supabase
      .from("authors")
      .select("id, name, slug, photo_url")
      .order("name");
    items = (data ?? []).map((a: any) => ({
      id: a.id,
      title: a.name,
      subtitle: `/${a.slug}`,
      href: `/authors/${a.id}`,
      imageUrl: a.photo_url ?? null,
      imageStyle: "photo",
    }));
  } else if (resource === "categories") {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, kind, sort_order")
      .order("sort_order")
      .order("name");
    items = (data ?? []).map((c: any) => ({
      id: c.id,
      title: c.name,
      subtitle: KIND_LABEL[c.kind] ?? c.kind,
      href: `/categories/${c.id}`,
      imageUrl: KIND_EMOJI[c.kind] ?? KIND_EMOJI.other,
      imageStyle: "emoji",
      reorderable: true,
    }));
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
