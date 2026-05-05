import { g as getSupabaseServerClient } from './supabase-server_ch9TzKCi.mjs';

async function loadCurrentUser(ctx) {
  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id, email, full_name, role").eq("id", user.id).maybeSingle();
  if (!profile) return null;
  return profile;
}
async function requireAdmin(ctx) {
  const user = await loadCurrentUser(ctx);
  if (!user) {
    return ctx.redirect(`/login?next=${encodeURIComponent(ctx.url.pathname)}`);
  }
  if (user.role !== "admin") {
    return ctx.redirect("/login?error=not_admin");
  }
  return user;
}

export { loadCurrentUser as l, requireAdmin as r };
