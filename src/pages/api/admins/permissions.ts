import type { APIRoute } from "astro";
import { requireOwner, RESOURCES, invalidateAuthCache, type Resource, type Level } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });

const VALID_LEVELS = new Set<Level>(["none", "view", "edit"]);

export const POST: APIRoute = async (ctx) => {
  const guard = await requireOwner(ctx);
  if (guard instanceof Response) return json({ error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const profileId = (body as { profileId?: unknown }).profileId;
  const permissions = (body as { permissions?: unknown }).permissions;
  if (typeof profileId !== "string" || !profileId) {
    return json({ error: "invalid_profile_id" }, 400);
  }
  if (!permissions || typeof permissions !== "object") {
    return json({ error: "invalid_permissions" }, 400);
  }

  // Validate each resource → level pair.
  const rows: { profile_id: string; resource: Resource; level: Level }[] = [];
  for (const [k, v] of Object.entries(permissions as Record<string, unknown>)) {
    if (!(RESOURCES as string[]).includes(k)) {
      return json({ error: `invalid_resource_${k}` }, 400);
    }
    if (typeof v !== "string" || !VALID_LEVELS.has(v as Level)) {
      return json({ error: `invalid_level_${k}` }, 400);
    }
    rows.push({ profile_id: profileId, resource: k as Resource, level: v as Level });
  }

  if (rows.length === 0) return json({ ok: true, updated: 0 });

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { error } = await supabase
    .from("admin_permissions")
    .upsert(rows, { onConflict: "profile_id,resource" });
  if (error) return json({ error: error.message }, 500);

  // Bust the in-memory permissions cache for the affected user so changes
  // are visible immediately.
  invalidateAuthCache(ctx, profileId);

  return json({ ok: true, updated: rows.length });
};
