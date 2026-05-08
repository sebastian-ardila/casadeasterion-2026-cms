import type { APIRoute } from "astro";
import { requireOwner } from "~/lib/auth";
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
  const enabled = (body as { enabled?: unknown }).enabled;
  if (typeof enabled !== "boolean") {
    return json({ error: "invalid_enabled" }, 400);
  }

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  // Upsert the boolean as JSONB. site_configuration.value is jsonb.
  const { error } = await supabase
    .from("site_configuration")
    .upsert({ key: "subscribe_enabled", value: enabled as never }, { onConflict: "key" });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, enabled });
};

export const GET: APIRoute = async (ctx) => {
  const guard = await requireOwner(ctx);
  if (guard instanceof Response) return json({ error: "unauthorized" }, 401);

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { data, error } = await supabase
    .from("site_configuration")
    .select("value")
    .eq("key", "subscribe_enabled")
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);

  // Default true when missing.
  const enabled = data?.value === false ? false : true;
  return json({ enabled });
};
