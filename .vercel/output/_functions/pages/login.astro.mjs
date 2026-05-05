import { e as createComponent, l as renderHead, n as renderSlot, r as renderTemplate, h as createAstro, k as renderComponent, m as maybeRenderHead, g as addAttribute, o as renderScript } from '../chunks/astro/server_Cc6zjcpi.mjs';
/* empty css                                */
export { renderers } from '../renderers.mjs';

const $$Astro$1 = createAstro();
const $$AuthLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$AuthLayout;
  const { title = "CMS" } = Astro2.props;
  return renderTemplate`<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>${title} · Casa de Asterión</title><link rel="icon" href="/favicon.svg">${renderHead()}</head> <body class="min-h-screen flex items-center justify-center"> <div class="w-full max-w-md px-6"> ${renderSlot($$result, $$slots["default"])} </div> </body></html>`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/layouts/AuthLayout.astro", void 0);

const $$Astro = createAstro();
const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  const error = Astro2.url.searchParams.get("error");
  const next = Astro2.url.searchParams.get("next") ?? "/";
  return renderTemplate`${renderComponent($$result, "AuthLayout", $$AuthLayout, { "title": "Acceder" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="text-center mb-10"> <p class="font-serif uppercase tracking-[0.18em] text-sm">Casa de Asterión</p> <p class="text-[11px] uppercase tracking-[0.18em] text-stone-500 mt-1">CMS</p> </div> <div class="bg-white border border-stone-200 p-8"> <h1 class="font-serif text-2xl mb-6">Iniciar sesión</h1> ${error === "not_admin" && renderTemplate`<p class="bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3 mb-5">
Tu cuenta no tiene permisos de administrador. Contacta al dueño del sitio.
</p>`} ${error === "oauth_failed" && renderTemplate`<p class="bg-red-50 border border-red-200 text-red-900 text-sm p-3 mb-5">
No se pudo completar el login. Intenta de nuevo.
</p>`} <button id="google-login" class="btn w-full flex items-center justify-center gap-3 py-3"${addAttribute(next, "data-next")}> <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"> <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"></path> <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"></path> <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"></path> <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"></path> </svg> <span>Continuar con Google</span> </button> <p class="text-xs text-stone-500 mt-6 text-center">
Solo correos autorizados pueden administrar el sitio.
</p> </div> ${renderScript($$result2, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/login.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/login.astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
