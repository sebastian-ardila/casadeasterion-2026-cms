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
  const { data: authors } = await supabase.from("authors").select("id, slug, name, photo_url").order("name");
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Autores" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex items-center justify-between mb-8"> <h1 class="font-serif text-3xl">Autores</h1> <a href="/authors/new" class="btn-primary">+ Nuevo autor</a> </div> ${authors && authors.length > 0 ? renderTemplate`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> ${authors.map((a) => renderTemplate`<a${addAttribute(`/authors/${a.id}`, "href")} class="border border-stone-200 bg-white p-5 hover:border-stone-900 transition flex items-center gap-4"> ${a.photo_url ? renderTemplate`<img${addAttribute(a.photo_url, "src")} alt="" class="w-16 h-16 object-cover bg-stone-100">` : renderTemplate`<div class="w-16 h-16 bg-stone-100"></div>`} <div> <p class="font-serif text-lg">${a.name}</p> <p class="text-xs text-stone-500">/${a.slug}</p> </div> </a>`)} </div>` : renderTemplate`<div class="border border-dashed border-stone-300 p-10 text-center text-stone-500"> <p>Aún no hay autores. <a href="/authors/new" class="underline text-stone-900">Crea el primero.</a></p> </div>`}` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/authors/index.astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/authors/index.astro";
const $$url = "/authors";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
