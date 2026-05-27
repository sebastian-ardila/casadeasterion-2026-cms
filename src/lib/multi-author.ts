// Server-side helpers para sincronizar las junctions de personas con
// libros y publicaciones, parametrizado por rol.
//
// Modelo: una sola tabla `authors` es la fuente de verdad para todas
// las personas (con role_tags como hint para CMS filtering). Para
// cada rol hay una junction separada que conecta authors con books o
// posts:
//
//   role          books junction        posts junction
//   -------       ----------------      ---------------
//   author        book_authors          post_authors
//   collaborator  book_collaborators    post_collaborators
//   translator    book_translators      post_translators
//   prologuist    book_prologuists      post_prologuists
//
// El MultiAuthorPicker en el form envía los IDs como CSV; los helpers
// parsean, deduplican y replican el delete+insert pattern de la
// implementación original (sin transacciones porque supabase-js no
// las expone vía REST).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

export type LinkRole = "author" | "collaborator" | "translator" | "prologuist";

const BOOK_TABLE: Record<LinkRole, string> = {
  author:       "book_authors",
  collaborator: "book_collaborators",
  translator:   "book_translators",
  prologuist:   "book_prologuists",
};

const POST_TABLE: Record<LinkRole, string> = {
  author:       "post_authors",
  collaborator: "post_collaborators",
  translator:   "post_translators",
  prologuist:   "post_prologuists",
};

/** Parse comma-separated UUIDs del FormData, dedup en orden. */
export function parseAuthorIds(fd: FormData, name: string): string[] {
  const raw = fd.get(name);
  if (typeof raw !== "string" || !raw.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of raw.split(",")) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

async function syncJunction(
  supabase: SupabaseClient<Database>,
  table: string,
  parentColumn: "book_id" | "post_id",
  parentId: string,
  authorIds: string[],
): Promise<void> {
  // Reemplazo total: borra todo y reinserta. Más simple que diffear,
  // y la junction tiene pocas filas por parent. Inconveniente menor:
  // los triggers de sync_primary_author (en book_authors / post_authors)
  // pueden disparar dos veces, pero idempotente.
  const { error: delErr } = await (supabase.from as any)(table)
    .delete()
    .eq(parentColumn, parentId);
  if (delErr) throw delErr;
  if (authorIds.length === 0) return;
  const rows = authorIds.map((author_id, index) => ({
    [parentColumn]: parentId,
    author_id,
    sort_order: index,
  }));
  const { error: insErr } = await (supabase.from as any)(table).insert(rows);
  if (insErr) throw insErr;
}

export function syncBookRole(
  supabase: SupabaseClient<Database>,
  role: LinkRole,
  bookId: string,
  authorIds: string[],
): Promise<void> {
  return syncJunction(supabase, BOOK_TABLE[role], "book_id", bookId, authorIds);
}

export function syncPostRole(
  supabase: SupabaseClient<Database>,
  role: LinkRole,
  postId: string,
  authorIds: string[],
): Promise<void> {
  return syncJunction(supabase, POST_TABLE[role], "post_id", postId, authorIds);
}

async function fetchJunctionIds(
  supabase: SupabaseClient<Database>,
  table: string,
  parentColumn: "book_id" | "post_id",
  parentId: string,
): Promise<string[]> {
  const { data } = await (supabase.from as any)(table)
    .select("author_id, sort_order")
    .eq(parentColumn, parentId)
    .order("sort_order");
  return (data ?? []).map((r: { author_id: string }) => r.author_id);
}

export function fetchBookRoleIds(
  supabase: SupabaseClient<Database>,
  role: LinkRole,
  bookId: string,
): Promise<string[]> {
  return fetchJunctionIds(supabase, BOOK_TABLE[role], "book_id", bookId);
}

export function fetchPostRoleIds(
  supabase: SupabaseClient<Database>,
  role: LinkRole,
  postId: string,
): Promise<string[]> {
  return fetchJunctionIds(supabase, POST_TABLE[role], "post_id", postId);
}

// ── Wrappers nombrados (legacy + legibilidad en los forms) ────────────

export function syncBookAuthors(supabase: SupabaseClient<Database>, bookId: string, ids: string[]) {
  return syncBookRole(supabase, "author", bookId, ids);
}
export function syncPostAuthors(supabase: SupabaseClient<Database>, postId: string, ids: string[]) {
  return syncPostRole(supabase, "author", postId, ids);
}
export function syncPostCollaborators(supabase: SupabaseClient<Database>, postId: string, ids: string[]) {
  return syncPostRole(supabase, "collaborator", postId, ids);
}
export function fetchBookAuthorIds(supabase: SupabaseClient<Database>, bookId: string) {
  return fetchBookRoleIds(supabase, "author", bookId);
}
export function fetchPostAuthorIds(supabase: SupabaseClient<Database>, postId: string) {
  return fetchPostRoleIds(supabase, "author", postId);
}
export function fetchPostCollaboratorIds(supabase: SupabaseClient<Database>, postId: string) {
  return fetchPostRoleIds(supabase, "collaborator", postId);
}
