import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead, g as addAttribute } from '../../chunks/astro/server_Cc6zjcpi.mjs';
import { $ as $$AppLayout } from '../../chunks/AppLayout_P03DaVtk.mjs';
import { a as str, s as strReq, t as tags, n as num, $ as $$Field } from '../../chunks/forms_CL_nkG5j.mjs';
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
  if (!id) return Astro2.redirect("/posts");
  const supabase = getSupabaseServerClient(Astro2.request, Astro2.cookies);
  let formError = null;
  let savedAt = null;
  if (Astro2.request.method === "POST") {
    try {
      const fd = await Astro2.request.formData();
      const action = str(fd, "_action");
      if (action === "delete") {
        const { error: error2 } = await supabase.from("posts").delete().eq("id", id);
        if (error2) throw error2;
        return Astro2.redirect("/posts");
      }
      const newStatus = str(fd, "status") ?? "draft";
      const content_md = strReq(fd, "content_md");
      const update = {
        title: strReq(fd, "title"),
        slug: strReq(fd, "slug"),
        subtitle: str(fd, "subtitle"),
        excerpt: str(fd, "excerpt"),
        content_md,
        cover_image_url: str(fd, "cover_image_url"),
        category_id: str(fd, "category_id"),
        author_id: str(fd, "author_id"),
        status: newStatus,
        reading_time_minutes: num(fd, "reading_time_minutes") ?? Math.max(1, Math.round(content_md.split(/\s+/).length / 220)),
        meta_description: str(fd, "meta_description"),
        tags: tags(fd, "tags")
      };
      const { data: existing } = await supabase.from("posts").select("published_at").eq("id", id).single();
      if (newStatus === "published" && !existing?.published_at) {
        update.published_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      const { error } = await supabase.from("posts").update(update).eq("id", id);
      if (error) throw error;
      savedAt = (/* @__PURE__ */ new Date()).toISOString();
    } catch (err) {
      formError = err instanceof Error ? err.message : "Error.";
    }
  }
  const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!post) return Astro2.redirect("/posts");
  const [{ data: authors }, { data: categories }] = await Promise.all([
    supabase.from("authors").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name")
  ]);
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": post.title }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex items-center gap-3 mb-8"> <a href="/posts" class="text-stone-500 hover:text-stone-900 text-sm">← Artículos</a> </div> <h1 class="font-serif text-3xl mb-2">${post.title}</h1> <p class="text-stone-500 text-sm mb-8">/${post.slug} · actualizado ${new Date(post.updated_at).toLocaleString("es-CO")}</p> ${formError && renderTemplate`<p class="bg-red-50 border border-red-200 text-red-900 text-sm p-3 mb-6">${formError}</p>`}${savedAt && renderTemplate`<p class="bg-green-50 border border-green-200 text-green-900 text-sm p-3 mb-6">Guardado.</p>`}<form method="POST" class="space-y-6 max-w-5xl"> ${renderComponent($$result2, "Field", $$Field, { "label": "T\xEDtulo", "name": "title", "value": post.title, "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "Slug", "name": "slug", "value": post.slug, "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "Subt\xEDtulo", "name": "subtitle", "value": post.subtitle })} ${renderComponent($$result2, "Field", $$Field, { "label": "Resumen", "name": "excerpt", "type": "textarea", "rows": 3, "value": post.excerpt })} ${renderComponent($$result2, "ImageUpload", $$ImageUpload, { "name": "cover_image_url", "value": post.cover_image_url, "label": "Imagen de portada", "bucket": "covers" })} <div class="grid grid-cols-2 gap-4"> <label class="block"> <span class="label">Autor</span> <select name="author_id" class="input"> <option value="">—</option> ${authors?.map((a) => renderTemplate`<option${addAttribute(a.id, "value")}${addAttribute(a.id === post.author_id, "selected")}>${a.name}</option>`)} </select> </label> <label class="block"> <span class="label">Categoría</span> <select name="category_id" class="input"> <option value="">—</option> ${categories?.map((c) => renderTemplate`<option${addAttribute(c.id, "value")}${addAttribute(c.id === post.category_id, "selected")}>${c.name}</option>`)} </select> </label> </div> ${renderComponent($$result2, "MarkdownEditor", $$MarkdownEditor, { "name": "content_md", "value": post.content_md, "label": "Contenido", "required": true })} <div class="grid grid-cols-3 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "Tiempo (min)", "name": "reading_time_minutes", "type": "number", "value": post.reading_time_minutes })} ${renderComponent($$result2, "Field", $$Field, { "label": "Tags", "name": "tags", "value": post.tags?.join(", "), "hint": "Separados por coma" })} <label class="block"> <span class="label">Estado</span> <select name="status" class="input"> <option value="draft"${addAttribute(post.status === "draft", "selected")}>Borrador</option> <option value="published"${addAttribute(post.status === "published", "selected")}>Publicado</option> </select> </label> </div> ${renderComponent($$result2, "Field", $$Field, { "label": "Meta description", "name": "meta_description", "type": "textarea", "rows": 2, "value": post.meta_description })} <div class="flex justify-between pt-4 border-t border-stone-200"> <button type="submit" class="btn-primary">Guardar</button> <a href="/posts" class="btn">Cancelar</a> </div> </form> <form method="POST" class="mt-12 pt-6 border-t border-red-200" onsubmit="return confirm('¿Borrar este artículo? No se puede deshacer.')"> <input type="hidden" name="_action" value="delete"> <p class="text-sm text-stone-600 mb-3">Zona de peligro</p> <button type="submit" class="btn-danger">Borrar artículo</button> </form> ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/posts/[id].astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/posts/[id].astro";
const $$url = "/posts/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
