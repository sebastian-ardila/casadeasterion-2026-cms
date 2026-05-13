import type { APIRoute } from "astro";
import { requirePermission } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

// GET: returns all staff_roles ordered by sort_order. Used by the role
// picker on /staff/[id] and /staff/new to populate its dropdown.
// POST: insert a new role row {name} after deduping case-insensitively.
//       Returns the inserted (or pre-existing) row.
// Both gated by staff:edit so a viewer can't seed the lookup.

export const GET: APIRoute = async (ctx) => {
  const guard = await requirePermission(ctx, "staff", "view");
  if (guard instanceof Response) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const sb = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { data } = await sb
    .from("staff_roles")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return new Response(JSON.stringify({ roles: data ?? [] }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store",
    },
  });
};

export const POST: APIRoute = async (ctx) => {
  const guard = await requirePermission(ctx, "staff", "edit");
  if (guard instanceof Response) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  let body: { name?: unknown } = {};
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return new Response(JSON.stringify({ error: "name is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const sb = getSupabaseServerClient(ctx.request, ctx.cookies);
  // Dedup case-insensitively. If the role already exists, return it
  // instead of failing — clients can call POST blindly when the user
  // types a new label and we'll do the right thing.
  const { data: existing } = await sb
    .from("staff_roles")
    .select("id, name, sort_order")
    .ilike("name", name)
    .maybeSingle();
  if (existing) {
    return new Response(JSON.stringify({ role: existing, created: false }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  // Place the new role at the end of the list by default.
  const { data: maxRow } = await sb
    .from("staff_roles")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? 0) + 10;
  const { data, error } = await sb
    .from("staff_roles")
    .insert({ name, sort_order: nextOrder })
    .select("id, name, sort_order")
    .single();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ role: data, created: true }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
