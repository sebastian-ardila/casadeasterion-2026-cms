import type { APIRoute } from "astro";
import { requireAdmin, getAllPermissions } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

// Returns counts for each resource the current user can see, so the
// sidebar can render a number badge next to each section header.
// Only includes keys the user has at least "view" on — the client
// shows what it gets and ignores missing keys.
export const GET: APIRoute = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard instanceof Response) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const perms = await getAllPermissions(ctx, guard);
  const sb = getSupabaseServerClient(ctx.request, ctx.cookies);
  const out: Record<string, number> = {};

  const countOf = async (table: string, key: string) => {
    const { count } = await sb.from(table).select("*", { count: "exact", head: true });
    out[key] = count ?? 0;
  };

  // Cuenta personas en `authors` que tienen el role_tag indicado.
  // Mismo head:true pattern; el contains-on-array funciona vía
  // PostgREST con el operador `cs`.
  const countAuthorsWithRole = async (role: string, key: string) => {
    const { count } = await sb
      .from("authors")
      .select("*", { count: "exact", head: true })
      .contains("role_tags", [role]);
    out[key] = count ?? 0;
  };

  // Libros publicados o en borrador SIN precio asignado — flag
  // editorial: aparece en el sidebar como badge naranja junto a Catálogo
  // para que el editor recuerde completarlos. price_amount null o 0.
  const countBooksWithoutPrice = async () => {
    const { count } = await sb
      .from("books")
      .select("*", { count: "exact", head: true })
      .or("price_amount.is.null,price_amount.eq.0");
    out.books_without_price = count ?? 0;
  };

  const tasks: Promise<unknown>[] = [];
  if (perms.books         !== "none") {
    tasks.push(countOf("books", "books"));
    tasks.push(countBooksWithoutPrice());
  }
  if (perms.posts         !== "none") tasks.push(countOf("posts",         "posts"));
  if (perms.authors       !== "none") tasks.push(countOf("authors",       "authors"));
  // Las 3 secciones siguientes son vistas filtradas de la tabla `authors`.
  if (perms.collaborators !== "none") tasks.push(countAuthorsWithRole("collaborator", "collaborators"));
  if (perms.translators   !== "none") tasks.push(countAuthorsWithRole("translator",   "translators"));
  if (perms.prologuists   !== "none") tasks.push(countAuthorsWithRole("prologuist",   "prologuists"));
  if (perms.staff         !== "none") tasks.push(countOf("staff",         "staff"));
  if (perms.collections   !== "none") tasks.push(countOf("collections",   "collections"));
  if (perms.categories    !== "none") tasks.push(countOf("categories",    "categories"));
  if (perms.subscribers   !== "none") tasks.push(countOf("subscribers",   "subscribers"));
  if (perms.orders        !== "none") tasks.push(countOf("purchase_intents", "orders"));
  if (perms.admins      !== "none") {
    // Admins live in auth.users joined via a SECURITY DEFINER RPC;
    // there's no plain count() path. Fetch the list and use length.
    tasks.push(
      sb.rpc("list_cms_users").then(({ data }) => {
        out.admins = (data ?? []).length;
      }),
    );
  }
  await Promise.allSettled(tasks);

  return new Response(JSON.stringify(out), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store",
    },
  });
};
