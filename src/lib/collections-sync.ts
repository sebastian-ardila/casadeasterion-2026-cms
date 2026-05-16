// Server-side helpers for the books ↔ collection relationship.
//
// A book belongs to 0 or 1 collection via the `books.collection_id`
// FK (no junction table). The MultiBookPicker on the collection
// edit form submits a comma-separated list of book IDs; we diff
// that list against the current state and run two bulk updates:
// one to clear `collection_id` on books removed from the picker,
// another to set it on books just added. Books that were already in
// the collection don't get re-written, which keeps `updated_at` on
// the row honest and avoids spurious Amplify rebuilds.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

export function parseIds(fd: FormData, name: string): string[] {
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

export async function fetchCollectionBookIds(
  supabase: SupabaseClient<Database>,
  collectionId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("books")
    // collection_id is a new column; types haven't been regenerated
    // until the migration is applied. Cast through unknown to keep
    // the call ergonomic without losing type safety on the rest.
    .select("id, collection_id" as never)
    .eq("collection_id" as never, collectionId as never);
  return (data ?? []).map((r: any) => r.id);
}

export async function syncCollectionBooks(
  supabase: SupabaseClient<Database>,
  collectionId: string,
  newBookIds: string[],
): Promise<void> {
  const current = await fetchCollectionBookIds(supabase, collectionId);
  const currentSet = new Set(current);
  const nextSet = new Set(newBookIds);

  const toRemove = current.filter((id) => !nextSet.has(id));
  const toAdd = newBookIds.filter((id) => !currentSet.has(id));

  if (toRemove.length) {
    const { error } = await supabase
      .from("books")
      .update({ collection_id: null } as never)
      .in("id", toRemove);
    if (error) throw error;
  }
  if (toAdd.length) {
    const { error } = await supabase
      .from("books")
      .update({ collection_id: collectionId } as never)
      .in("id", toAdd);
    if (error) throw error;
  }
}
