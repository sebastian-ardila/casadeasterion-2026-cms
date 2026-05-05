import { g as getSupabaseServerClient } from '../chunks/supabase-server_ch9TzKCi.mjs';
export { renderers } from '../renderers.mjs';

const POST = async (ctx) => {
  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  await supabase.auth.signOut();
  return ctx.redirect("/login");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
