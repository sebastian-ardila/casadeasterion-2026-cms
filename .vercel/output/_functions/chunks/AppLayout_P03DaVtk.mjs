import { e as createComponent, m as maybeRenderHead, g as addAttribute, r as renderTemplate, k as renderComponent, h as createAstro, q as Fragment, l as renderHead, n as renderSlot } from './astro/server_Cc6zjcpi.mjs';
/* empty css                        */

const $$Astro$1 = createAstro();
const $$Sidebar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Sidebar;
  const { user } = Astro2.props;
  const path = Astro2.url.pathname;
  const items = [
    { href: "/", label: "Inicio" },
    { href: "/books", label: "Libros" },
    { href: "/posts", label: "Art\xEDculos" },
    { href: "/authors", label: "Autores" },
    { href: "/categories", label: "Categor\xEDas" },
    { href: "/site", label: "Configuraci\xF3n" }
  ];
  const isActive = (href) => path === href || href !== "/" && path.startsWith(href);
  return renderTemplate`${maybeRenderHead()}<aside class="w-64 shrink-0 border-r border-stone-200 bg-stone-50 min-h-screen flex flex-col"> <div class="px-6 py-8"> <p class="font-serif uppercase tracking-[0.18em] text-sm">Casa de Asterión</p> <p class="text-[11px] uppercase tracking-[0.18em] text-stone-500 mt-1">CMS</p> </div> <nav class="flex-1 px-2"> ${items.map((item) => renderTemplate`<a${addAttribute(item.href, "href")}${addAttribute([
    "nav-link",
    isActive(item.href) && "nav-link-active"
  ], "class:list")}> ${item.label} </a>`)} </nav> <div class="border-t border-stone-200 px-6 py-5 text-xs text-stone-600"> ${user ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <p class="truncate font-medium text-stone-900">${user.full_name ?? user.email}</p> <p class="truncate text-stone-500">${user.email}</p> <form action="/logout" method="POST" class="mt-3"> <button class="text-stone-600 hover:text-stone-900 underline">Cerrar sesión</button> </form> ` })}` : renderTemplate`<a href="/login" class="underline">Iniciar sesión</a>`} </div> </aside>`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/components/Sidebar.astro", void 0);

const $$Astro = createAstro();
const $$AppLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AppLayout;
  const user = Astro2.locals.user;
  const { title = "CMS" } = Astro2.props;
  return renderTemplate`<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>${title} · Casa de Asterión CMS</title><link rel="icon" href="/favicon.svg">${renderHead()}</head> <body class="min-h-screen flex"> ${renderComponent($$result, "Sidebar", $$Sidebar, { "user": user })} <main class="flex-1 min-w-0 px-10 py-10 max-w-[1100px]"> ${renderSlot($$result, $$slots["default"])} </main> </body></html>`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/layouts/AppLayout.astro", void 0);

export { $$AppLayout as $ };
