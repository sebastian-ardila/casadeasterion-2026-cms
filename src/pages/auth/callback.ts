import type { APIRoute } from "astro";
import { getSupabaseServerClient } from "~/lib/supabase-server";

export const GET: APIRoute = async (ctx) => {
  const code = ctx.url.searchParams.get("code");
  const next = ctx.url.searchParams.get("next") ?? "/";

  // Google or Supabase may bounce back with explicit error info instead of
  // a code (e.g. user denied, Workspace blocked the app, scope mismatch).
  // Surface it back to /login so the user sees a useful message instead of
  // a generic "no se pudo completar el login".
  const oauthError = ctx.url.searchParams.get("error");
  const oauthErrorDesc = ctx.url.searchParams.get("error_description");
  if (oauthError) {
    console.error("[auth/callback] oauth provider returned error:", oauthError, oauthErrorDesc);
    return ctx.redirect(
      `/login?error=oauth_failed&reason=${encodeURIComponent(oauthError)}` +
      (oauthErrorDesc ? `&detail=${encodeURIComponent(oauthErrorDesc)}` : ""),
    );
  }

  if (!code) {
    return ctx.redirect("/login?error=oauth_failed&reason=missing_code");
  }

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchange failed:", error.message);
    return ctx.redirect(
      `/login?error=oauth_failed&reason=exchange_failed&detail=${encodeURIComponent(error.message)}`,
    );
  }

  return ctx.redirect(next);
};
