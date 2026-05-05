import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead, g as addAttribute } from '../../chunks/astro/server_Cc6zjcpi.mjs';
import { $ as $$AppLayout } from '../../chunks/AppLayout_P03DaVtk.mjs';
import { s as strReq, a as str, b as slugify, t as tags, n as num, $ as $$Field } from '../../chunks/forms_CL_nkG5j.mjs';
import { $ as $$ImageUpload, a as $$MarkdownEditor } from '../../chunks/ImageUpload_D8GBONwT.mjs';
import { r as requireAdmin } from '../../chunks/auth_DWIRVYmF.mjs';
import { g as getSupabaseServerClient } from '../../chunks/supabase-server_ch9TzKCi.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$New = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$New;
  const guard = await requireAdmin(Astro2);
  if (guard instanceof Response) return guard;
  const supabase = getSupabaseServerClient(Astro2.request, Astro2.cookies);
  let formError = null;
  if (Astro2.request.method === "POST") {
    try {
      const fd = await Astro2.request.formData();
      const title = strReq(fd, "title");
      const slug = str(fd, "slug") ?? slugify(title);
      const status = str(fd, "status") ?? "draft";
      const published_at = status === "published" ? (/* @__PURE__ */ new Date()).toISOString() : null;
      const { data, error } = await supabase.from("books").insert({
        title,
        slug,
        subtitle: str(fd, "subtitle"),
        description_md: str(fd, "description_md"),
        cover_image_url: str(fd, "cover_image_url"),
        author_id: str(fd, "author_id"),
        category_id: str(fd, "category_id"),
        isbn: str(fd, "isbn"),
        pages: num(fd, "pages"),
        format: str(fd, "format"),
        price_amount: num(fd, "price_amount"),
        price_currency: str(fd, "price_currency") ?? "COP",
        whatsapp_message_override: str(fd, "whatsapp_message_override"),
        publication_date: str(fd, "publication_date"),
        status,
        published_at,
        tags: tags(fd, "tags")
      }).select("id").single();
      if (error) throw error;
      return Astro2.redirect(`/books/${data.id}`);
    } catch (err) {
      formError = err instanceof Error ? err.message : "Error desconocido.";
    }
  }
  const [{ data: authors }, { data: categories }] = await Promise.all([
    supabase.from("authors").select("id, name").order("name"),
    supabase.from("categories").select("id, name, kind").order("name")
  ]);
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Nuevo libro" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex items-center gap-3 mb-8"> <a href="/books" class="text-stone-500 hover:text-stone-900 text-sm">← Libros</a> </div> <h1 class="font-serif text-3xl mb-8">Nuevo libro</h1> ${formError && renderTemplate`<p class="bg-red-50 border border-red-200 text-red-900 text-sm p-3 mb-6">${formError}</p>`}<form method="POST" class="space-y-6 max-w-3xl"> ${renderComponent($$result2, "Field", $$Field, { "label": "T\xEDtulo", "name": "title", "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "Slug", "name": "slug", "hint": "Se genera autom\xE1ticamente del t\xEDtulo si lo dejas vac\xEDo." })} ${renderComponent($$result2, "Field", $$Field, { "label": "Subt\xEDtulo", "name": "subtitle" })} ${renderComponent($$result2, "ImageUpload", $$ImageUpload, { "name": "cover_image_url", "label": "Portada", "bucket": "covers" })} <div class="grid grid-cols-2 gap-4"> <label class="block"> <span class="label">Autor</span> <select name="author_id" class="input"> <option value="">—</option> ${authors?.map((a) => renderTemplate`<option${addAttribute(a.id, "value")}>${a.name}</option>`)} </select> </label> <label class="block"> <span class="label">Categoría</span> <select name="category_id" class="input"> <option value="">—</option> ${categories?.map((c) => renderTemplate`<option${addAttribute(c.id, "value")}>${c.name} (${c.kind})</option>`)} </select> </label> </div> ${renderComponent($$result2, "MarkdownEditor", $$MarkdownEditor, { "name": "description_md", "label": "Descripci\xF3n" })} <div class="grid grid-cols-2 lg:grid-cols-4 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "ISBN", "name": "isbn" })} ${renderComponent($$result2, "Field", $$Field, { "label": "P\xE1ginas", "name": "pages", "type": "number" })} <label class="block"> <span class="label">Formato</span> <select name="format" class="input"> <option value="">—</option> <option value="paperback">Tapa blanda</option> <option value="hardcover">Tapa dura</option> <option value="ebook">Ebook</option> <option value="other">Otro</option> </select> </label> ${renderComponent($$result2, "Field", $$Field, { "label": "Publicado", "name": "publication_date", "type": "date" })} </div> <div class="grid grid-cols-3 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "Precio", "name": "price_amount", "type": "number" })} <label class="block"> <span class="label">Moneda</span> <select name="price_currency" class="input"> <option value="COP" selected>COP</option> <option value="USD">USD</option> <option value="EUR">EUR</option> </select> </label> ${renderComponent($$result2, "Field", $$Field, { "label": "Tags", "name": "tags", "hint": "Separados por coma" })} </div> ${renderComponent($$result2, "Field", $$Field, { "label": "Mensaje WhatsApp custom", "name": "whatsapp_message_override", "type": "textarea", "rows": 3, "hint": "Si vac\xEDo, usa la plantilla global. Variables: {{title}}, {{author}}, {{isbn}}, {{slug}}." })} <label class="block"> <span class="label">Estado</span> <select name="status" class="input max-w-xs"> <option value="draft" selected>Borrador</option> <option value="published">Publicado</option> </select> </label> <div class="flex gap-3 pt-4"> <button type="submit" class="btn-primary">Crear libro</button> <a href="/books" class="btn">Cancelar</a> </div> </form> ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/books/new.astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/books/new.astro";
const $$url = "/books/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
