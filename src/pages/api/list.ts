import type { APIRoute } from "astro";
import { requirePermission, type Resource } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

type Item = {
  id: string;
  title: string;
  subtitle: string | null;
  status?: string | null;
  href: string;
};

const ALLOWED = new Set<Resource>(["posts", "books", "authors"]);

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
      .select("id, title, slug, status, updated_at, authors(name)")
      .order("updated_at", { ascending: false });
    items = (data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      subtitle: p.authors?.name ?? p.slug,
      status: p.status,
      href: `/posts/${p.id}`,
    }));
  } else if (resource === "books") {
    const { data } = await supabase
      .from("books")
      .select("id, title, slug, status, updated_at, authors(name)")
      .order("updated_at", { ascending: false });
    items = (data ?? []).map((b: any) => ({
      id: b.id,
      title: b.title,
      subtitle: b.authors?.name ?? b.slug,
      status: b.status,
      href: `/books/${b.id}`,
    }));
  } else if (resource === "authors") {
    const { data } = await supabase
      .from("authors")
      .select("id, name, slug")
      .order("name");
    items = (data ?? []).map((a: any) => ({
      id: a.id,
      title: a.name,
      subtitle: `/${a.slug}`,
      href: `/authors/${a.id}`,
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
