import { g as getSupabaseServerClient } from '../../chunks/supabase-server_ch9TzKCi.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async (ctx) => {
  const code = ctx.url.searchParams.get("code");
  const next = ctx.url.searchParams.get("next") ?? "/";
  if (!code) {
    return ctx.redirect("/login?error=oauth_failed");
  }
  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchange failed:", error.message);
    return ctx.redirect("/login?error=oauth_failed");
  }
  return ctx.redirect(next);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
