import type { APIRoute } from "astro";
import { requirePermission } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";
import { describeAuditEntry, type AuditEntry } from "~/lib/audit";
import { formatAgo } from "~/lib/relative-time";

const PAGE = 50;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });

export const GET: APIRoute = async (ctx) => {
  const guard = await requirePermission(ctx, "activity", "view");
  if (guard instanceof Response) return json({ error: "unauthorized" }, 401);

  const profileId = ctx.url.searchParams.get("profileId");
  if (!profileId) return json({ error: "invalid_profile_id" }, 400);
  const before = ctx.url.searchParams.get("before");

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);
  let q = supabase
    .from("audit_log")
    .select("id, action, resource, record_label, details, created_at")
    .eq("actor_id", profileId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE);
  if (before) q = q.lt("id", Number(before));

  const { data, error } = await q;
  if (error) return json({ error: error.message }, 500);

  const rows = (data ?? []) as unknown as AuditEntry[];
  const entries = rows.map((r) => {
    const { icon, text } = describeAuditEntry(r);
    return { id: r.id, icon, text, ago: formatAgo(r.created_at) };
  });
  return json({ entries, hasMore: entries.length === PAGE });
};
