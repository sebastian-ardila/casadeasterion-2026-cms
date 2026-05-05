import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../../chunks/astro/server_Cc6zjcpi.mjs';
import { $ as $$AppLayout } from '../../chunks/AppLayout_P03DaVtk.mjs';
import { a as str, s as strReq, $ as $$Field } from '../../chunks/forms_CL_nkG5j.mjs';
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
  if (!id) return Astro2.redirect("/authors");
  const supabase = getSupabaseServerClient(Astro2.request, Astro2.cookies);
  let formError = null;
  let savedAt = null;
  if (Astro2.request.method === "POST") {
    try {
      const fd = await Astro2.request.formData();
      if (str(fd, "_action") === "delete") {
        const { error: error2 } = await supabase.from("authors").delete().eq("id", id);
        if (error2) throw error2;
        return Astro2.redirect("/authors");
      }
      const { error } = await supabase.from("authors").update({
        name: strReq(fd, "name"),
        slug: strReq(fd, "slug"),
        bio_md: str(fd, "bio_md"),
        photo_url: str(fd, "photo_url"),
        links: {
          twitter: str(fd, "link_twitter") ?? "",
          web: str(fd, "link_web") ?? "",
          instagram: str(fd, "link_instagram") ?? ""
        }
      }).eq("id", id);
      if (error) throw error;
      savedAt = (/* @__PURE__ */ new Date()).toISOString();
    } catch (err) {
      formError = err instanceof Error ? err.message : "Error.";
    }
  }
  const { data: author } = await supabase.from("authors").select("*").eq("id", id).maybeSingle();
  if (!author) return Astro2.redirect("/authors");
  const links = author.links ?? {};
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": author.name }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex items-center gap-3 mb-8"> <a href="/authors" class="text-stone-500 hover:text-stone-900 text-sm">← Autores</a> </div> <h1 class="font-serif text-3xl mb-2">${author.name}</h1> <p class="text-stone-500 text-sm mb-8">/${author.slug}</p> ${formError && renderTemplate`<p class="bg-red-50 border border-red-200 text-red-900 text-sm p-3 mb-6">${formError}</p>`}${savedAt && renderTemplate`<p class="bg-green-50 border border-green-200 text-green-900 text-sm p-3 mb-6">Guardado.</p>`}<form method="POST" class="space-y-6 max-w-3xl"> ${renderComponent($$result2, "Field", $$Field, { "label": "Nombre", "name": "name", "value": author.name, "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "Slug", "name": "slug", "value": author.slug, "required": true })} ${renderComponent($$result2, "ImageUpload", $$ImageUpload, { "name": "photo_url", "value": author.photo_url, "label": "Foto", "bucket": "authors" })} ${renderComponent($$result2, "MarkdownEditor", $$MarkdownEditor, { "name": "bio_md", "value": author.bio_md, "label": "Biograf\xEDa" })} <div class="grid grid-cols-3 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "Web", "name": "link_web", "type": "url", "value": links.web })} ${renderComponent($$result2, "Field", $$Field, { "label": "Twitter", "name": "link_twitter", "type": "url", "value": links.twitter })} ${renderComponent($$result2, "Field", $$Field, { "label": "Instagram", "name": "link_instagram", "type": "url", "value": links.instagram })} </div> <div class="flex justify-between pt-4 border-t border-stone-200"> <button type="submit" class="btn-primary">Guardar</button> <a href="/authors" class="btn">Cancelar</a> </div> </form> <form method="POST" class="mt-12 pt-6 border-t border-red-200" onsubmit="return confirm('¿Borrar este autor? Los libros y artículos quedarán sin autor asignado.')"> <input type="hidden" name="_action" value="delete"> <p class="text-sm text-stone-600 mb-3">Zona de peligro</p> <button type="submit" class="btn-danger">Borrar autor</button> </form> ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/authors/[id].astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/authors/[id].astro";
const $$url = "/authors/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
