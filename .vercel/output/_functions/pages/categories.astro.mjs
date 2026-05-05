import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_Cc6zjcpi.mjs';
import { $ as $$AppLayout } from '../chunks/AppLayout_P03DaVtk.mjs';
import { a as str, s as strReq, n as num, b as slugify, $ as $$Field } from '../chunks/forms_CL_nkG5j.mjs';
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
  let formError = null;
  let saved = false;
  if (Astro2.request.method === "POST") {
    try {
      const fd = await Astro2.request.formData();
      const action = str(fd, "_action");
      if (action === "delete") {
        const id = strReq(fd, "id");
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
      } else if (action === "update") {
        const id = strReq(fd, "id");
        const { error } = await supabase.from("categories").update({
          slug: strReq(fd, "slug"),
          name: strReq(fd, "name"),
          kind: strReq(fd, "kind"),
          description: str(fd, "description"),
          sort_order: num(fd, "sort_order") ?? 0
        }).eq("id", id);
        if (error) throw error;
      } else {
        const name = strReq(fd, "name");
        const { error } = await supabase.from("categories").insert({
          slug: str(fd, "slug") ?? slugify(name),
          name,
          kind: strReq(fd, "kind"),
          description: str(fd, "description"),
          sort_order: num(fd, "sort_order") ?? 0
        });
        if (error) throw error;
      }
      saved = true;
    } catch (err) {
      formError = err instanceof Error ? err.message : "Error.";
    }
  }
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order").order("name");
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Categor\xEDas" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="font-serif text-3xl mb-2">Categorías</h1> <p class="text-stone-500 mb-8">Alimentan los menús "Filosofía" y "Poesía", y agrupan posts y libros.</p> ${formError && renderTemplate`<p class="bg-red-50 border border-red-200 text-red-900 text-sm p-3 mb-6">${formError}</p>`}${saved && renderTemplate`<p class="bg-green-50 border border-green-200 text-green-900 text-sm p-3 mb-6">Guardado.</p>`}<div class="space-y-4 mb-12"> ${categories?.map((c) => renderTemplate`<form method="POST" class="border border-stone-200 bg-white p-5 grid grid-cols-12 gap-3 items-end"> <input type="hidden" name="_action" value="update"> <input type="hidden" name="id"${addAttribute(c.id, "value")}> <div class="col-span-3"> ${renderComponent($$result2, "Field", $$Field, { "label": "Nombre", "name": "name", "value": c.name, "required": true })} </div> <div class="col-span-3"> ${renderComponent($$result2, "Field", $$Field, { "label": "Slug", "name": "slug", "value": c.slug, "required": true })} </div> <div class="col-span-2"> <label class="block"> <span class="label">Tipo</span> <select name="kind" class="input"> ${["philosophy", "poetry", "book", "other"].map((k) => renderTemplate`<option${addAttribute(k, "value")}${addAttribute(c.kind === k, "selected")}>${k}</option>`)} </select> </label> </div> <div class="col-span-1"> ${renderComponent($$result2, "Field", $$Field, { "label": "Orden", "name": "sort_order", "type": "number", "value": c.sort_order })} </div> <div class="col-span-3 flex gap-2 justify-end"> <button type="submit" class="btn">Guardar</button> <button type="submit" formnovalidate name="_action" value="delete" class="btn-danger"${addAttribute(`return confirm('\xBFBorrar la categor\xEDa "${c.name}"?')`, "onclick")}>Borrar</button> </div> <div class="col-span-12"> ${renderComponent($$result2, "Field", $$Field, { "label": "Descripci\xF3n", "name": "description", "type": "textarea", "rows": 2, "value": c.description })} </div> </form>`)} </div> <form method="POST" class="border border-stone-300 border-dashed p-5 grid grid-cols-12 gap-3 items-end"> <h2 class="col-span-12 font-serif text-xl">Nueva categoría</h2> <div class="col-span-3"> ${renderComponent($$result2, "Field", $$Field, { "label": "Nombre", "name": "name", "required": true })} </div> <div class="col-span-3"> ${renderComponent($$result2, "Field", $$Field, { "label": "Slug", "name": "slug", "hint": "Auto si vac\xEDo" })} </div> <div class="col-span-2"> <label class="block"> <span class="label">Tipo</span> <select name="kind" class="input" required> <option value="philosophy">philosophy</option> <option value="poetry">poetry</option> <option value="book">book</option> <option value="other">other</option> </select> </label> </div> <div class="col-span-1"> ${renderComponent($$result2, "Field", $$Field, { "label": "Orden", "name": "sort_order", "type": "number" })} </div> <div class="col-span-3 flex gap-2 justify-end"> <button type="submit" class="btn-primary">Crear</button> </div> <div class="col-span-12"> ${renderComponent($$result2, "Field", $$Field, { "label": "Descripci\xF3n", "name": "description", "type": "textarea", "rows": 2 })} </div> </form> ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/categories/index.astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/categories/index.astro";
const $$url = "/categories";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
