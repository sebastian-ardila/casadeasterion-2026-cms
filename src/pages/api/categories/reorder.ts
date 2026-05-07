import type { APIRoute } from "astro";
import { requirePermission } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });

export const POST: APIRoute = async (ctx) => {
  const guard = await requirePermission(ctx, "categories", "edit");
  if (guard instanceof Response) return json({ error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const order = (body as { order?: unknown }).order;
  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    return json({ error: "invalid_order" }, 400);
  }
  const ids = order as string[];
  if (ids.length === 0) return json({ ok: true, updated: 0 });

  // Spread sort_order in steps of 10 so future single-row insertions can land
  // between two existing categories without renumbering the whole table.
  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const updates = ids.map((id, idx) =>
    supabase
      .from("categories")
      .update({ sort_order: (idx + 1) * 10 })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) return json({ error: firstError.error.message }, 500);

  return json({ ok: true, updated: ids.length });
};
