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
      const content_md = strReq(fd, "content_md");
      const reading = Math.max(1, Math.round(content_md.split(/\s+/).length / 220));
      const { data, error } = await supabase.from("posts").insert({
        title,
        slug,
        subtitle: str(fd, "subtitle"),
        excerpt: str(fd, "excerpt"),
        content_md,
        cover_image_url: str(fd, "cover_image_url"),
        category_id: str(fd, "category_id"),
        author_id: str(fd, "author_id"),
        status,
        published_at: status === "published" ? (/* @__PURE__ */ new Date()).toISOString() : null,
        reading_time_minutes: num(fd, "reading_time_minutes") ?? reading,
        meta_description: str(fd, "meta_description"),
        tags: tags(fd, "tags")
      }).select("id").single();
      if (error) throw error;
      return Astro2.redirect(`/posts/${data.id}`);
    } catch (err) {
      formError = err instanceof Error ? err.message : "Error.";
    }
  }
  const [{ data: authors }, { data: categories }] = await Promise.all([
    supabase.from("authors").select("id, name").order("name"),
    supabase.from("categories").select("id, name, kind").order("name")
  ]);
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Nuevo art\xEDculo" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex items-center gap-3 mb-8"> <a href="/posts" class="text-stone-500 hover:text-stone-900 text-sm">← Artículos</a> </div> <h1 class="font-serif text-3xl mb-8">Nuevo artículo</h1> ${formError && renderTemplate`<p class="bg-red-50 border border-red-200 text-red-900 text-sm p-3 mb-6">${formError}</p>`}<form method="POST" class="space-y-6 max-w-5xl"> ${renderComponent($$result2, "Field", $$Field, { "label": "T\xEDtulo", "name": "title", "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "Slug", "name": "slug", "hint": "Se genera del t\xEDtulo si lo dejas vac\xEDo." })} ${renderComponent($$result2, "Field", $$Field, { "label": "Subt\xEDtulo", "name": "subtitle" })} ${renderComponent($$result2, "Field", $$Field, { "label": "Resumen (excerpt)", "name": "excerpt", "type": "textarea", "rows": 3, "hint": "Aparece en tarjetas de listados." })} ${renderComponent($$result2, "ImageUpload", $$ImageUpload, { "name": "cover_image_url", "label": "Imagen de portada", "bucket": "covers" })} <div class="grid grid-cols-2 gap-4"> <label class="block"> <span class="label">Autor</span> <select name="author_id" class="input"> <option value="">—</option> ${authors?.map((a) => renderTemplate`<option${addAttribute(a.id, "value")}>${a.name}</option>`)} </select> </label> <label class="block"> <span class="label">Categoría</span> <select name="category_id" class="input"> <option value="">—</option> ${categories?.map((c) => renderTemplate`<option${addAttribute(c.id, "value")}>${c.name}</option>`)} </select> </label> </div> ${renderComponent($$result2, "MarkdownEditor", $$MarkdownEditor, { "name": "content_md", "label": "Contenido", "required": true })} <div class="grid grid-cols-3 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "Tiempo de lectura (min)", "name": "reading_time_minutes", "type": "number", "hint": "Vac\xEDo = se calcula del contenido." })} ${renderComponent($$result2, "Field", $$Field, { "label": "Tags", "name": "tags", "hint": "Separados por coma" })} <label class="block"> <span class="label">Estado</span> <select name="status" class="input"> <option value="draft" selected>Borrador</option> <option value="published">Publicado</option> </select> </label> </div> ${renderComponent($$result2, "Field", $$Field, { "label": "Meta description (SEO)", "name": "meta_description", "type": "textarea", "rows": 2 })} <div class="flex gap-3 pt-4"> <button type="submit" class="btn-primary">Crear artículo</button> <a href="/posts" class="btn">Cancelar</a> </div> </form> ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/posts/new.astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/posts/new.astro";
const $$url = "/posts/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
