import type { APIRoute } from "astro";
import { requirePermission, invalidateAuthCache } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });

// Re-grants admin access to a previously-revoked user. We only need the
// email, not the profile id — the handle_admin_email_added trigger will
// promote the existing profile to 'admin' AND seed full edit permissions
// the moment the row lands in admin_emails.
export const POST: APIRoute = async (ctx) => {
  const guard = await requirePermission(ctx, "admins", "edit");
  if (guard instanceof Response) return json({ error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const email = (body as { email?: unknown }).email;
  const profileId = (body as { profileId?: unknown }).profileId;
  if (typeof email !== "string" || !email) {
    return json({ error: "invalid_email" }, 400);
  }

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { error } = await supabase
    .from("admin_emails")
    .insert({ email: email.trim().toLowerCase(), added_by: guard.user.id, note: "re-granted" });
  if (error) return json({ error: error.message }, 500);

  if (typeof profileId === "string") invalidateAuthCache(ctx, profileId);
  return json({ ok: true });
};
