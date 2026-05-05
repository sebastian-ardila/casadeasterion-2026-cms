import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../chunks/astro/server_Cc6zjcpi.mjs';
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
  const user = guard;
  const supabase = getSupabaseServerClient(Astro2.request, Astro2.cookies);
  const [books, posts, authors, categories, subs] = await Promise.all([
    supabase.from("books").select("id,status", { count: "exact", head: false }),
    supabase.from("posts").select("id,status", { count: "exact", head: false }),
    supabase.from("authors").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("subscribers").select("id,confirmed_at,unsubscribed_at", { count: "exact" })
  ]);
  const stats = {
    books_total: books.data?.length ?? 0,
    books_published: books.data?.filter((b) => b.status === "published").length ?? 0,
    posts_total: posts.data?.length ?? 0,
    posts_published: posts.data?.filter((p) => p.status === "published").length ?? 0,
    authors: authors.count ?? 0,
    categories: categories.count ?? 0,
    subs_confirmed: subs.data?.filter((s) => s.confirmed_at && !s.unsubscribed_at).length ?? 0
  };
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Inicio" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="font-serif text-3xl mb-2">Buenas, ${user.full_name?.split(" ")[0] ?? "admin"}.</h1> <p class="text-stone-500 mb-10">Resumen del catálogo.</p> <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"> <a href="/books" class="border border-stone-200 bg-white p-5 hover:border-stone-900 transition"> <p class="text-xs uppercase tracking-[0.12em] text-stone-500">Libros</p> <p class="font-serif text-3xl mt-1">${stats.books_total}</p> <p class="text-xs text-stone-500 mt-1">${stats.books_published} publicados</p> </a> <a href="/posts" class="border border-stone-200 bg-white p-5 hover:border-stone-900 transition"> <p class="text-xs uppercase tracking-[0.12em] text-stone-500">Artículos</p> <p class="font-serif text-3xl mt-1">${stats.posts_total}</p> <p class="text-xs text-stone-500 mt-1">${stats.posts_published} publicados</p> </a> <a href="/authors" class="border border-stone-200 bg-white p-5 hover:border-stone-900 transition"> <p class="text-xs uppercase tracking-[0.12em] text-stone-500">Autores</p> <p class="font-serif text-3xl mt-1">${stats.authors}</p> </a> <a href="/categories" class="border border-stone-200 bg-white p-5 hover:border-stone-900 transition"> <p class="text-xs uppercase tracking-[0.12em] text-stone-500">Categorías</p> <p class="font-serif text-3xl mt-1">${stats.categories}</p> </a> </div> <div class="border border-stone-200 bg-white p-6"> <h2 class="font-serif text-xl mb-2">Newsletter</h2> <p class="text-stone-600 text-sm"> <span class="font-medium text-stone-900">${stats.subs_confirmed}</span> suscriptores confirmados.
</p> </div> ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/index.astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
