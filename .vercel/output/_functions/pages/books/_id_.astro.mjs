import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead, g as addAttribute } from '../../chunks/astro/server_Cc6zjcpi.mjs';
import { $ as $$AppLayout } from '../../chunks/AppLayout_P03DaVtk.mjs';
import { a as str, t as tags, n as num, s as strReq, $ as $$Field } from '../../chunks/forms_CL_nkG5j.mjs';
import { $ as $$ImageUpload, a as $$MarkdownEditor } from '../../chunks/ImageUpload_D8GBONwT.mjs';
import { r as requireAdmin } from '../../chunks/auth_DWIRVYmF.mjs';
import { g as getSupabaseServerClient } from '../../chunks/supabase-server_ch9TzKCi.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const guard = await requireAdmin(Astro2);
  if (guard instanceof Response) return guard;
  const { id } = Astro2.params;
  if (!id) return Astro2.redirect("/books");
  const supabase = getSupabaseServerClient(Astro2.request, Astro2.cookies);
  let formError = null;
  let savedAt = null;
  if (Astro2.request.method === "POST") {
    try {
      const fd = await Astro2.request.formData();
      const action = str(fd, "_action");
      if (action === "delete") {
        const { error: error2 } = await supabase.from("books").delete().eq("id", id);
        if (error2) throw error2;
        return Astro2.redirect("/books");
      }
      const newStatus = str(fd, "status") ?? "draft";
      const update = {
        title: strReq(fd, "title"),
        slug: strReq(fd, "slug"),
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
        status: newStatus,
        tags: tags(fd, "tags")
      };
      const { data: existing } = await supabase.from("books").select("published_at, status").eq("id", id).single();
      if (newStatus === "published" && !existing?.published_at) {
        update.published_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      const { error } = await supabase.from("books").update(update).eq("id", id);
      if (error) throw error;
      savedAt = (/* @__PURE__ */ new Date()).toISOString();
    } catch (err) {
      formError = err instanceof Error ? err.message : "Error desconocido.";
    }
  }
  const { data: book } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  if (!book) return Astro2.redirect("/books");
  const [{ data: authors }, { data: categories }] = await Promise.all([
    supabase.from("authors").select("id, name").order("name"),
    supabase.from("categories").select("id, name, kind").order("name")
  ]);
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": book.title }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex items-center gap-3 mb-8"> <a href="/books" class="text-stone-500 hover:text-stone-900 text-sm">← Libros</a> </div> <h1 class="font-serif text-3xl mb-2">${book.title}</h1> <p class="text-stone-500 text-sm mb-8">/${book.slug} · actualizado ${new Date(book.updated_at).toLocaleString("es-CO")}</p> ${formError && renderTemplate`<p class="bg-red-50 border border-red-200 text-red-900 text-sm p-3 mb-6">${formError}</p>`}${savedAt && renderTemplate`<p class="bg-green-50 border border-green-200 text-green-900 text-sm p-3 mb-6">Guardado.</p>`}<form method="POST" class="space-y-6 max-w-3xl"> ${renderComponent($$result2, "Field", $$Field, { "label": "T\xEDtulo", "name": "title", "value": book.title, "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "Slug", "name": "slug", "value": book.slug, "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "Subt\xEDtulo", "name": "subtitle", "value": book.subtitle })} ${renderComponent($$result2, "ImageUpload", $$ImageUpload, { "name": "cover_image_url", "value": book.cover_image_url, "label": "Portada", "bucket": "covers" })} <div class="grid grid-cols-2 gap-4"> <label class="block"> <span class="label">Autor</span> <select name="author_id" class="input"> <option value="">—</option> ${authors?.map((a) => renderTemplate`<option${addAttribute(a.id, "value")}${addAttribute(a.id === book.author_id, "selected")}>${a.name}</option>`)} </select> </label> <label class="block"> <span class="label">Categoría</span> <select name="category_id" class="input"> <option value="">—</option> ${categories?.map((c) => renderTemplate`<option${addAttribute(c.id, "value")}${addAttribute(c.id === book.category_id, "selected")}>${c.name} (${c.kind})</option>`)} </select> </label> </div> ${renderComponent($$result2, "MarkdownEditor", $$MarkdownEditor, { "name": "description_md", "value": book.description_md, "label": "Descripci\xF3n" })} <div class="grid grid-cols-2 lg:grid-cols-4 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "ISBN", "name": "isbn", "value": book.isbn })} ${renderComponent($$result2, "Field", $$Field, { "label": "P\xE1ginas", "name": "pages", "type": "number", "value": book.pages })} <label class="block"> <span class="label">Formato</span> <select name="format" class="input"> <option value="">—</option> ${["paperback", "hardcover", "ebook", "other"].map((f) => renderTemplate`<option${addAttribute(f, "value")}${addAttribute(book.format === f, "selected")}>${f}</option>`)} </select> </label> ${renderComponent($$result2, "Field", $$Field, { "label": "Publicado", "name": "publication_date", "type": "date", "value": book.publication_date })} </div> <div class="grid grid-cols-3 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "Precio", "name": "price_amount", "type": "number", "value": book.price_amount })} <label class="block"> <span class="label">Moneda</span> <select name="price_currency" class="input"> ${["COP", "USD", "EUR"].map((c) => renderTemplate`<option${addAttribute(c, "value")}${addAttribute(book.price_currency === c, "selected")}>${c}</option>`)} </select> </label> ${renderComponent($$result2, "Field", $$Field, { "label": "Tags", "name": "tags", "value": book.tags?.join(", "), "hint": "Separados por coma" })} </div> ${renderComponent($$result2, "Field", $$Field, { "label": "Mensaje WhatsApp custom", "name": "whatsapp_message_override", "type": "textarea", "rows": 3, "value": book.whatsapp_message_override, "hint": "Si vac\xEDo, usa la plantilla global. Variables: {{title}}, {{author}}, {{isbn}}, {{slug}}." })} <label class="block"> <span class="label">Estado</span> <select name="status" class="input max-w-xs"> <option value="draft"${addAttribute(book.status === "draft", "selected")}>Borrador</option> <option value="published"${addAttribute(book.status === "published", "selected")}>Publicado</option> </select> </label> <div class="flex justify-between pt-4 border-t border-stone-200"> <button type="submit" class="btn-primary">Guardar cambios</button> <a href="/books" class="btn">Cancelar</a> </div> </form> <form method="POST" class="mt-12 pt-6 border-t border-red-200" onsubmit="return confirm('¿Seguro que quieres borrar este libro? Esta acción es permanente.')"> <input type="hidden" name="_action" value="delete"> <p class="text-sm text-stone-600 mb-3">Zona de peligro</p> <button type="submit" class="btn-danger">Borrar libro</button> </form> ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/books/[id].astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/books/[id].astro";
const $$url = "/books/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
