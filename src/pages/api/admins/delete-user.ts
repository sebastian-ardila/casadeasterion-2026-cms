import type { APIRoute } from "astro";
import { requireOwner, invalidateAuthCache } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });

export const POST: APIRoute = async (ctx) => {
  const guard = await requireOwner(ctx);
  if (guard instanceof Response) return json({ error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const targetId = (body as { profileId?: unknown }).profileId;
  if (typeof targetId !== "string" || !targetId) {
    return json({ error: "invalid_profile_id" }, 400);
  }

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { error } = await supabase.rpc("delete_admin_user", { target_id: targetId });
  if (error) return json({ error: error.message }, 500);

  invalidateAuthCache(ctx, targetId);
  return json({ ok: true });
};
