import type { APIRoute } from "astro";
import { requirePermission, CONFIGURABLE_RESOURCES, invalidateAuthCache, type Resource, type Level } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });

const VALID_LEVELS = new Set<Level>(["none", "view", "edit"]);

export const POST: APIRoute = async (ctx) => {
  const guard = await requirePermission(ctx, "admins", "edit");
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

  // Safeguards: a non-owner admin with edit on "admins" still cannot
  // tweak themselves or the owner. Without these checks an admin could
  // unilaterally elevate their own permissions or strip the owner.
  if (profileId === guard.user.id) {
    return json({ error: "cannot_edit_self" }, 403);
  }
  const supabaseCheck = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { data: targetProfile } = await supabaseCheck
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .maybeSingle();
  if (targetProfile?.role === "owner") {
    return json({ error: "cannot_edit_owner" }, 403);
  }
  // A non-owner manager (admin role) can only edit editor profiles.
  // Owners can edit anyone (except themselves and other owners — guarded above).
  if (guard.user.role !== "owner" && targetProfile?.role !== "editor") {
    return json({ error: "only_owner_can_edit_admin" }, 403);
  }
  if (!permissions || typeof permissions !== "object") {
    return json({ error: "invalid_permissions" }, 400);
  }

  // Validate each resource → level pair. Only the configurable subset is
  // accepted — subscribers / admins are role-derived and shouldn't be
  // upserted here.
  const rows: { profile_id: string; resource: Resource; level: Level }[] = [];
  for (const [k, v] of Object.entries(permissions as Record<string, unknown>)) {
    if (!(CONFIGURABLE_RESOURCES as string[]).includes(k)) {
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
