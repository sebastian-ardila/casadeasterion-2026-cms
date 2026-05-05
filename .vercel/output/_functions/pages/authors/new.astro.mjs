import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../../chunks/astro/server_Cc6zjcpi.mjs';
import { $ as $$AppLayout } from '../../chunks/AppLayout_P03DaVtk.mjs';
import { s as strReq, a as str, b as slugify, $ as $$Field } from '../../chunks/forms_CL_nkG5j.mjs';
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
      const name = strReq(fd, "name");
      const slug = str(fd, "slug") ?? slugify(name);
      const { data, error } = await supabase.from("authors").insert({
        name,
        slug,
        bio_md: str(fd, "bio_md"),
        photo_url: str(fd, "photo_url"),
        links: {
          twitter: str(fd, "link_twitter") ?? "",
          web: str(fd, "link_web") ?? "",
          instagram: str(fd, "link_instagram") ?? ""
        }
      }).select("id").single();
      if (error) throw error;
      return Astro2.redirect(`/authors/${data.id}`);
    } catch (err) {
      formError = err instanceof Error ? err.message : "Error.";
    }
  }
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Nuevo autor" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex items-center gap-3 mb-8"> <a href="/authors" class="text-stone-500 hover:text-stone-900 text-sm">← Autores</a> </div> <h1 class="font-serif text-3xl mb-8">Nuevo autor</h1> ${formError && renderTemplate`<p class="bg-red-50 border border-red-200 text-red-900 text-sm p-3 mb-6">${formError}</p>`}<form method="POST" class="space-y-6 max-w-3xl"> ${renderComponent($$result2, "Field", $$Field, { "label": "Nombre", "name": "name", "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "Slug", "name": "slug", "hint": "Se genera del nombre si lo dejas vac\xEDo." })} ${renderComponent($$result2, "ImageUpload", $$ImageUpload, { "name": "photo_url", "label": "Foto", "bucket": "authors", "hint": "Cuadrada, m\xEDnimo 600\xD7600px." })} ${renderComponent($$result2, "MarkdownEditor", $$MarkdownEditor, { "name": "bio_md", "label": "Biograf\xEDa" })} <div class="grid grid-cols-3 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "Web", "name": "link_web", "type": "url" })} ${renderComponent($$result2, "Field", $$Field, { "label": "Twitter", "name": "link_twitter", "type": "url" })} ${renderComponent($$result2, "Field", $$Field, { "label": "Instagram", "name": "link_instagram", "type": "url" })} </div> <div class="flex gap-3 pt-4"> <button type="submit" class="btn-primary">Crear autor</button> <a href="/authors" class="btn">Cancelar</a> </div> </form> ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/authors/new.astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/authors/new.astro";
const $$url = "/authors/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
