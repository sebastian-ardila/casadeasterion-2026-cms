import { e as createComponent, m as maybeRenderHead, g as addAttribute, u as unescapeHTML, r as renderTemplate, h as createAstro } from './astro/server_Cc6zjcpi.mjs';

const $$Astro = createAstro();
const $$Field = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Field;
  const { label, name, type = "text", value, required, placeholder, hint, rows } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<label class="block"> <span class="label">${label}${required && " *"}</span> ${type === "textarea" ? renderTemplate`<textarea${addAttribute(name, "name")} class="input"${addAttribute(rows ?? 4, "rows")}${addAttribute(required, "required")}${addAttribute(placeholder, "placeholder")}>${unescapeHTML(value ?? "")}</textarea>` : renderTemplate`<input${addAttribute(type, "type")}${addAttribute(name, "name")} class="input"${addAttribute(value ?? "", "value")}${addAttribute(required, "required")}${addAttribute(placeholder, "placeholder")}>`} ${hint && renderTemplate`<p class="text-xs text-stone-500 mt-1">${hint}</p>`} </label>`;
}, "/Users/dila/Docs/Code/casadeasterion-2026-cms/src/components/Field.astro", void 0);

function str(fd, key) {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}
function strReq(fd, key) {
  const v = str(fd, key);
  if (v === null) throw new Error(`Missing required field: ${key}`);
  return v;
}
function num(fd, key) {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function tags(fd, key) {
  const v = str(fd, key);
  if (v === null) return [];
  return v.split(",").map((t) => t.trim()).filter(Boolean);
}
function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export { $$Field as $, str as a, slugify as b, num as n, strReq as s, tags as t };
