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

  const tasks: Promise<unknown>[] = [];
  if (perms.books       !== "none") tasks.push(countOf("books",       "books"));
  if (perms.posts       !== "none") tasks.push(countOf("posts",       "posts"));
  if (perms.authors     !== "none") tasks.push(countOf("authors",     "authors"));
  if (perms.categories  !== "none") tasks.push(countOf("categories",  "categories"));
  if (perms.subscribers !== "none") tasks.push(countOf("subscribers", "subscribers"));
  // Orders are visible to anyone with the admins capability
  // (owners + admins). Permissions don't include "orders" yet, so we
  // mirror the admins gate.
  if (perms.admins      !== "none") tasks.push(countOf("purchase_intents", "orders"));
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
