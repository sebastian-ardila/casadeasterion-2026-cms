// Server-side helpers for syncing the book_authors / post_authors
// junction tables from form submissions.
//
// The form's MultiAuthorPicker submits author IDs as a comma-separated
// string in display order. parseAuthorIds() splits and dedupes, the
// sync*Authors() helpers replace the junction rows for a single parent.
//
// Implementation note: we delete + insert (rather than diff) because
// it's simpler and the junction holds only a handful of rows per
// parent. Each insert/update fires a maintenance trigger that
// recomputes the parent's denormalized author_id; doing this inside
// one transaction would be cleaner but the supabase-js client doesn't
// support transactions over the REST API. The two-step delete-then-
// insert temporarily leaves the row with no authors — the trigger
// nulls out books.author_id, then the insert restores it.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

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
  table: "book_authors" | "post_authors",
  parentColumn: "book_id" | "post_id",
  parentId: string,
  authorIds: string[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from(table)
    .delete()
    .eq(parentColumn, parentId);
  if (delErr) throw delErr;
  if (authorIds.length === 0) return;
  const rows = authorIds.map((author_id, index) => ({
    [parentColumn]: parentId,
    author_id,
    sort_order: index,
  }));
  const { error: insErr } = await supabase.from(table).insert(rows as never);
  if (insErr) throw insErr;
}

export function syncBookAuthors(
  supabase: SupabaseClient<Database>,
  bookId: string,
  authorIds: string[],
): Promise<void> {
  return syncJunction(supabase, "book_authors", "book_id", bookId, authorIds);
}

export function syncPostAuthors(
  supabase: SupabaseClient<Database>,
  postId: string,
  authorIds: string[],
): Promise<void> {
  return syncJunction(supabase, "post_authors", "post_id", postId, authorIds);
}

export async function fetchBookAuthorIds(
  supabase: SupabaseClient<Database>,
  bookId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("book_authors")
    .select("author_id, sort_order")
    .eq("book_id", bookId)
    .order("sort_order");
  return (data ?? []).map((r) => r.author_id);
}

export async function fetchPostAuthorIds(
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("post_authors")
    .select("author_id, sort_order")
    .eq("post_id", postId)
    .order("sort_order");
  return (data ?? []).map((r) => r.author_id);
}

// Collaborator junction. Same shape as author junction but with a
// different child column name; we keep a separate helper instead of
// generalizing the sync function because the column names differ and
// PostgREST is strict about insert keys.

export async function syncPostCollaborators(
  supabase: SupabaseClient<Database>,
  postId: string,
  collaboratorIds: string[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from("post_collaborators")
    .delete()
    .eq("post_id", postId);
  if (delErr) throw delErr;
  if (collaboratorIds.length === 0) return;
  const rows = collaboratorIds.map((collaborator_id, index) => ({
    post_id: postId,
    collaborator_id,
    sort_order: index,
  }));
  const { error: insErr } = await supabase.from("post_collaborators").insert(rows as never);
  if (insErr) throw insErr;
}

export async function fetchPostCollaboratorIds(
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("post_collaborators")
    .select("collaborator_id, sort_order")
    .eq("post_id", postId)
    .order("sort_order");
  return (data ?? []).map((r) => r.collaborator_id);
}
