// Shared "hace X" / "X ago" helpers for the CMS UI. Used by the
// ListPanel API (post/book/author/category meta) and by /site
// (last-saved indicator next to the submit button).

/** "hace un momento" / "hace 2 min" / "hace 3 h" / "hace 5 días" /
 *  "el 30 nov 2024". Returns "" if the input isn't parseable. */
export function formatAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 60) return "hace un momento";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `hace ${day} día${day === 1 ? "" : "s"}`;
  const month = Math.floor(day / 30);
  if (month < 12) return `hace ${month} mes${month === 1 ? "" : "es"}`;
  const formatted = new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric",
  });
  return `el ${formatted}`;
}

/** Full display name (nombre y apellido). Falls back to email-prefix
 *  if the profile has no full_name set yet, and "alguien" as a last
 *  resort so the UI never shows raw "null" or empty. */
export function fullName(
  p: { full_name?: string | null; email?: string | null } | null | undefined,
): string {
  if (!p) return "alguien";
  const name = (p.full_name ?? "").trim();
  if (name) return name;
  const email = (p.email ?? "").trim();
  if (email) return email.split("@")[0];
  return "alguien";
}

/** Prefix used by editorMeta. The ListPanel renderer detects this
 *  to find the name segment and wrap it in a link to /admins/<id>. */
export const EDITOR_PREFIX = "Editado por ";
/** Separator between the name and the timestamp. */
export const EDITOR_SEP = " · ";

/** "Editado por Sebastián Ardila · hace 2 días". If editor is
 *  missing, just the timestamp ("hace 2 días"). The ListPanel and
 *  /site renderers split this string on EDITOR_PREFIX + EDITOR_SEP
 *  to identify the name segment and turn it into a link to
 *  /admins/<id> when an editorId is also supplied. */
export function editorMeta(
  updated_at: string | null | undefined,
  editor: { full_name?: string | null; email?: string | null } | null | undefined,
): string {
  const ago = formatAgo(updated_at);
  if (!ago) return "";
  if (!editor || (!editor.full_name && !editor.email)) return ago;
  return `${EDITOR_PREFIX}${fullName(editor)}${EDITOR_SEP}${ago}`;
}
