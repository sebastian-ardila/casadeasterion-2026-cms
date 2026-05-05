import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_Cc6zjcpi.mjs';
import { $ as $$AppLayout } from '../chunks/AppLayout_P03DaVtk.mjs';
import { r as requireAdmin } from '../chunks/auth_DWIRVYmF.mjs';
import { g as getSupabaseServerClient } from '../chunks/supabase-server_ch9TzKCi.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const guard = await requireAdmin(Astro2);
  if (guard instanceof Response) return guard;
  const supabase = getSupabaseServerClient(Astro2.request, Astro2.cookies);
  const [{ data: posts }, { data: authors }, { data: categories }] = await Promise.all([
    supabase.from("posts").select("id, slug, title, status, author_id, category_id, published_at").order("updated_at", { ascending: false }),
    supabase.from("authors").select("id, name"),
    supabase.from("categories").select("id, name")
  ]);
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a.name]));
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Art\xEDculos" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex items-center justify-between mb-8"> <h1 class="font-serif text-3xl">Artículos</h1> <a href="/posts/new" class="btn-primary">+ Nuevo artículo</a> </div> ${posts && posts.length > 0 ? renderTemplate`<div class="border border-stone-200 bg-white"> <table class="w-full text-sm"> <thead class="bg-stone-50 text-xs uppercase tracking-[0.12em] text-stone-600"> <tr> <th class="text-left px-4 py-3 font-semibold">Título</th> <th class="text-left px-4 py-3 font-semibold">Categoría</th> <th class="text-left px-4 py-3 font-semibold">Autor</th> <th class="text-left px-4 py-3 font-semibold">Estado</th> </tr> </thead> <tbody> ${posts.map((p) => renderTemplate`<tr class="border-t border-stone-100 hover:bg-stone-50"> <td class="px-4 py-3"> <a${addAttribute(`/posts/${p.id}`, "href")} class="hover:underline">${p.title}</a> <p class="text-xs text-stone-500">/${p.slug}</p> </td> <td class="px-4 py-3 text-stone-700">${categoryMap.get(p.category_id ?? "") ?? "\u2014"}</td> <td class="px-4 py-3 text-stone-700">${authorMap.get(p.author_id ?? "") ?? "\u2014"}</td> <td class="px-4 py-3"> <span${addAttribute([
    "text-[11px] uppercase tracking-[0.12em] px-2 py-0.5",
    p.status === "published" ? "bg-green-100 text-green-900" : "bg-stone-200 text-stone-700"
  ], "class:list")}>${p.status}</span> </td> </tr>`)} </tbody> </table> </div>` : renderTemplate`<div class="border border-dashed border-stone-300 p-10 text-center text-stone-500"> <p>Aún no hay artículos. <a href="/posts/new" class="underline text-stone-900">Crea el primero.</a></p> </div>`}` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/posts/index.astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/posts/index.astro";
const $$url = "/posts";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
