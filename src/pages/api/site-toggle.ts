import type { APIRoute } from "astro";
import { requirePermission, type Resource } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

// Generic boolean toggle for site_configuration keys that gate
// public-site sections (nosotros, colecciones, etc.). The site
// reads these via loadSiteConfig() and hides the section when the
// value is `false`. site_configuration already triggers an Amplify
// rebuild on every change.
//
// Each key is paired with the resource permission required to flip
// it — so toggling /nosotros lives under the staff resource (the
// editor who can manage the people there is also the one who can
// hide the section).

const TOGGLES: Record<string, { resource: Resource }> = {
  nosotros_enabled: { resource: "staff" },
  // future: colecciones_enabled, equipo_enabled, etc.
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });

export const POST: APIRoute = async (ctx) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const key = (body as { key?: unknown }).key;
  const enabled = (body as { enabled?: unknown }).enabled;
  if (typeof key !== "string" || !TOGGLES[key]) {
    return json({ error: "unknown_key" }, 400);
  }
  if (typeof enabled !== "boolean") {
    return json({ error: "invalid_enabled" }, 400);
  }

  const guard = await requirePermission(ctx, TOGGLES[key].resource, "edit");
  if (guard instanceof Response) return json({ error: "unauthorized" }, 401);

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { error } = await supabase
    .from("site_configuration")
    .upsert({ key, value: enabled as never }, { onConflict: "key" });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, key, enabled });
};

export const GET: APIRoute = async (ctx) => {
  const url = new URL(ctx.request.url);
  const key = url.searchParams.get("key");
  if (!key || !TOGGLES[key]) {
    return json({ error: "unknown_key" }, 400);
  }
  const guard = await requirePermission(ctx, TOGGLES[key].resource, "view");
  if (guard instanceof Response) return json({ error: "unauthorized" }, 401);

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { data, error } = await supabase
    .from("site_configuration")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);

  // Default true when the row doesn't exist yet.
  const enabled = data?.value === false ? false : true;
  return json({ enabled });
};
