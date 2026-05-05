import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../chunks/astro/server_Cc6zjcpi.mjs';
import { $ as $$AppLayout } from '../chunks/AppLayout_P03DaVtk.mjs';
import { s as strReq, a as str, $ as $$Field } from '../chunks/forms_CL_nkG5j.mjs';
import { r as requireAdmin } from '../chunks/auth_DWIRVYmF.mjs';
import { g as getSupabaseServerClient } from '../chunks/supabase-server_ch9TzKCi.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Site = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Site;
  const guard = await requireAdmin(Astro2);
  if (guard instanceof Response) return guard;
  const supabase = getSupabaseServerClient(Astro2.request, Astro2.cookies);
  let formError = null;
  let saved = false;
  if (Astro2.request.method === "POST") {
    try {
      const fd = await Astro2.request.formData();
      const rows = [
        { key: "hero_quote", value: strReq(fd, "hero_quote") },
        { key: "hero_quote_author", value: strReq(fd, "hero_quote_author") },
        { key: "editorial_description", value: strReq(fd, "editorial_description") },
        { key: "footer_legal", value: strReq(fd, "footer_legal") },
        { key: "whatsapp_phone", value: strReq(fd, "whatsapp_phone") },
        { key: "whatsapp_message_template", value: strReq(fd, "whatsapp_message_template") },
        {
          key: "social_links",
          value: {
            facebook: str(fd, "social_facebook") ?? "",
            instagram: str(fd, "social_instagram") ?? "",
            twitter: str(fd, "social_twitter") ?? ""
          }
        }
      ];
      const { error } = await supabase.from("site_configuration").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      saved = true;
    } catch (err) {
      formError = err instanceof Error ? err.message : "Error.";
    }
  }
  const { data: config } = await supabase.from("site_configuration").select("key, value");
  const cfg = new Map((config ?? []).map((r) => [r.key, r.value]));
  const social = cfg.get("social_links") ?? {};
  return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Configuraci\xF3n" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="font-serif text-3xl mb-2">Configuración del sitio</h1> <p class="text-stone-500 mb-8">Textos, contacto y redes que aparecen en el frontend público.</p> ${formError && renderTemplate`<p class="bg-red-50 border border-red-200 text-red-900 text-sm p-3 mb-6">${formError}</p>`}${saved && renderTemplate`<p class="bg-green-50 border border-green-200 text-green-900 text-sm p-3 mb-6">Guardado.</p>`}<form method="POST" class="space-y-8 max-w-3xl"> <section class="space-y-4"> <h2 class="font-serif text-xl">Cita destacada del homepage</h2> ${renderComponent($$result2, "Field", $$Field, { "label": "Cita", "name": "hero_quote", "type": "textarea", "rows": 3, "value": String(cfg.get("hero_quote") ?? ""), "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "Autor de la cita", "name": "hero_quote_author", "value": String(cfg.get("hero_quote_author") ?? ""), "required": true })} </section> <section class="space-y-4"> <h2 class="font-serif text-xl">Editorial</h2> ${renderComponent($$result2, "Field", $$Field, { "label": "Descripci\xF3n (para footer y SEO)", "name": "editorial_description", "type": "textarea", "rows": 3, "value": String(cfg.get("editorial_description") ?? ""), "required": true })} ${renderComponent($$result2, "Field", $$Field, { "label": "L\xEDnea legal del footer", "name": "footer_legal", "value": String(cfg.get("footer_legal") ?? ""), "required": true })} </section> <section class="space-y-4"> <h2 class="font-serif text-xl">WhatsApp (compras)</h2> <div class="grid grid-cols-2 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "N\xFAmero (E.164)", "name": "whatsapp_phone", "value": String(cfg.get("whatsapp_phone") ?? ""), "required": true, "hint": "Ej: +573117462759" })} </div> ${renderComponent($$result2, "Field", $$Field, { "label": "Plantilla del mensaje", "name": "whatsapp_message_template", "type": "textarea", "rows": 3, "value": String(cfg.get("whatsapp_message_template") ?? ""), "required": true, "hint": "Variables: {{title}}, {{author}}, {{isbn}}, {{slug}}." })} </section> <section class="space-y-4"> <h2 class="font-serif text-xl">Redes sociales</h2> <div class="grid grid-cols-3 gap-4"> ${renderComponent($$result2, "Field", $$Field, { "label": "Facebook", "name": "social_facebook", "type": "url", "value": social.facebook ?? "" })} ${renderComponent($$result2, "Field", $$Field, { "label": "Instagram", "name": "social_instagram", "type": "url", "value": social.instagram ?? "" })} ${renderComponent($$result2, "Field", $$Field, { "label": "Twitter / X", "name": "social_twitter", "type": "url", "value": social.twitter ?? "" })} </div> </section> <div class="flex gap-3 pt-4 border-t border-stone-200"> <button type="submit" class="btn-primary">Guardar configuración</button> </div> </form> ` })}`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/site.astro", void 0);

const $$file = "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/pages/site.astro";
const $$url = "/site";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Site,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
