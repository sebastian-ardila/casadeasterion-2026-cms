import type { APIRoute } from "astro";
import { requirePermission, requireOwner, requireAdmin, getAllPermissions, type Resource } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });

export const GET: APIRoute = async (ctx) => {
  const url = new URL(ctx.request.url);
  const type = url.searchParams.get("type");
  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);

  if (type === "categories") {
    const guard = await requirePermission(ctx, "categories", "view");
    if (guard instanceof Response) return json({ error: "unauthorized" }, 401);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) return json({ error: error.message }, 500);
    return json({ categories: data ?? [], canEdit: guard.permission === "edit" });
  }

  if (type === "site") {
    const guard = await requirePermission(ctx, "site", "edit");
    if (guard instanceof Response) return json({ error: "unauthorized" }, 401);
    const { data, error } = await supabase.from("site_configuration").select("key, value");
    if (error) return json({ error: error.message }, 500);
    const cfg: Record<string, unknown> = {};
    for (const row of data ?? []) cfg[row.key] = row.value;
    return json({ config: cfg });
  }

  if (type === "options") {
    // For dropdowns in posts/books forms.
    const guard = await requireAdmin(ctx);
    if (guard instanceof Response) return json({ error: "unauthorized" }, 401);
    const [{ data: authors }, { data: categories }] = await Promise.all([
      supabase.from("authors").select("id, name").order("name"),
      supabase.from("categories").select("id, name, kind").order("name"),
    ]);
    return json({ authors: authors ?? [], categories: categories ?? [] });
  }

  if (type === "post") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "missing id" }, 400);
    const guard = await requirePermission(ctx, "posts", "edit");
    if (guard instanceof Response) return json({ error: "unauthorized" }, 401);
    const { data: post, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!post) return json({ error: "not found" }, 404);
    const [{ data: authors }, { data: categories }] = await Promise.all([
      supabase.from("authors").select("id, name").order("name"),
      supabase.from("categories").select("id, name").order("name"),
    ]);
    return json({ post, authors: authors ?? [], categories: categories ?? [] });
  }

  if (type === "book") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "missing id" }, 400);
    const guard = await requirePermission(ctx, "books", "edit");
    if (guard instanceof Response) return json({ error: "unauthorized" }, 401);
    const { data: book, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!book) return json({ error: "not found" }, 404);
    const [{ data: authors }, { data: categories }] = await Promise.all([
      supabase.from("authors").select("id, name").order("name"),
      supabase.from("categories").select("id, name, kind").order("name"),
    ]);
    return json({ book, authors: authors ?? [], categories: categories ?? [] });
  }

  if (type === "author") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "missing id" }, 400);
    const guard = await requirePermission(ctx, "authors", "edit");
    if (guard instanceof Response) return json({ error: "unauthorized" }, 401);
    const { data: author, error } = await supabase.from("authors").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!author) return json({ error: "not found" }, 404);
    return json({ author });
  }

  if (type === "admins") {
    const guard = await requireOwner(ctx);
    if (guard instanceof Response) return json({ error: "unauthorized" }, 401);
    const [
      { data: profiles },
      { data: allowlist },
      { data: permRows },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role")
        .in("role", ["owner", "admin"])
        .order("role")
        .order("email"),
      supabase.from("admin_emails").select("email, added_at, note"),
      supabase.from("admin_permissions").select("profile_id, resource, level"),
    ]);
    return json({
      profiles: profiles ?? [],
      allowlist: allowlist ?? [],
      permRows: permRows ?? [],
      ownerId: guard.id,
      ownerEmail: guard.email,
    });
  }

  if (type === "subscribers") {
    const guard = await requireOwner(ctx);
    if (guard instanceof Response) return json({ error: "unauthorized" }, 401);
    const filter = (url.searchParams.get("filter") ?? "all").toLowerCase();
    let q = supabase
      .from("subscribers")
      .select("id, email, source, confirmed_at, unsubscribed_at, created_at")
      .order("created_at", { ascending: false });
    if (filter === "confirmed") q = q.not("confirmed_at", "is", null).is("unsubscribed_at", null);
    else if (filter === "pending") q = q.is("confirmed_at", null);
    else if (filter === "unsub") q = q.not("unsubscribed_at", "is", null);
    const { data, error } = await q;
    if (error) return json({ error: error.message }, 500);
    return json({ subscribers: data ?? [] });
  }

  if (type === "home") {
    const guard = await requireAdmin(ctx);
    if (guard instanceof Response) return json({ error: "unauthorized" }, 401);
    const perms = await getAllPermissions(ctx, guard);
    const isOwner = guard.role === "owner";
    const [books, posts, authors, categories, subs] = await Promise.all([
      perms.books !== "none" ? supabase.from("books").select("id,status") : Promise.resolve({ data: null }),
      perms.posts !== "none" ? supabase.from("posts").select("id,status") : Promise.resolve({ data: null }),
      perms.authors !== "none" ? supabase.from("authors").select("id", { count: "exact", head: true }) : Promise.resolve({ count: null }),
      perms.categories !== "none" ? supabase.from("categories").select("id", { count: "exact", head: true }) : Promise.resolve({ count: null }),
      isOwner ? supabase.from("subscribers").select("id,confirmed_at,unsubscribed_at") : Promise.resolve({ data: null }),
    ] as const);
    return json({
      stats: {
        books_total: (books as any).data?.length ?? 0,
        books_published: (books as any).data?.filter((b: any) => b.status === "published").length ?? 0,
        posts_total: (posts as any).data?.length ?? 0,
        posts_published: (posts as any).data?.filter((p: any) => p.status === "published").length ?? 0,
        authors: (authors as any).count ?? 0,
        categories: (categories as any).count ?? 0,
        subs_confirmed: (subs as any).data?.filter((s: any) => s.confirmed_at && !s.unsubscribed_at).length ?? 0,
        subs_pending: (subs as any).data?.filter((s: any) => !s.confirmed_at).length ?? 0,
      },
    });
  }

  return json({ error: "invalid type" }, 400);
};
