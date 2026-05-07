import type { APIRoute } from "astro";
import { requirePermission, type Resource } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

type Item = {
  id: string;
  title: string;
  subtitle: string | null;
  status?: string | null;
  href: string;
  imageUrl?: string | null;
  /** "photo" → round, used for authors. "cover" → rectangular, used for books/articles.
   *  "emoji" → render `imageUrl` as a literal character/emoji (used for categories). */
  imageStyle?: "photo" | "cover" | "emoji";
  /** Categories: extra metadata used to render reorder controls. */
  reorderable?: boolean;
};

const ALLOWED = new Set<Resource>(["posts", "books", "authors", "categories"]);

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
  const resource = url.searchParams.get("resource") as Resource | null;

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
