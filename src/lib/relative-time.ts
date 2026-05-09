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

/** First name (or email-prefix fallback). Long full names eat row width. */
export function shortName(
  p: { full_name?: string | null; email?: string | null } | null | undefined,
): string {
  if (!p) return "alguien";
  const name = (p.full_name ?? "").trim();
  if (name) {
    const first = name.split(/\s+/)[0];
    return first || name;
  }
  const email = (p.email ?? "").trim();
  if (email) return email.split("@")[0];
  return "alguien";
}

/** "Sebastián · hace 2 días". If editor is missing, just the timestamp. */
export function editorMeta(
  updated_at: string | null | undefined,
  editor: { full_name?: string | null; email?: string | null } | null | undefined,
): string {
  const ago = formatAgo(updated_at);
  if (!ago) return "";
  if (!editor || (!editor.full_name && !editor.email)) return ago;
  return `${shortName(editor)} · ${ago}`;
}
