import type { APIRoute } from "astro";
import { AmplifyClient, ListJobsCommand } from "@aws-sdk/client-amplify";
import { requireAdmin } from "~/lib/auth";

// Read an env var from both runtime (process.env, populated by Amplify
// Hosting Lambda at request time) and build-time (import.meta.env, which
// Astro only inlines for PUBLIC_* by default). Non-PUBLIC variables are
// generally only visible via process.env in SSR contexts.
function readEnv(name: string): string | undefined {
  const v =
    (typeof process !== "undefined" ? process.env?.[name] : undefined) ??
    (import.meta.env as Record<string, string | undefined>)[name];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

let client: AmplifyClient | null = null;
function getClient(accessKeyId: string, secretKey: string) {
  if (client) return client;
  client = new AmplifyClient({
    region: readEnv("AMPLIFY_REGION") ?? "us-east-1",
    credentials: {
      accessKeyId,
      secretAccessKey: secretKey,
    },
  });
  return client;
}

export const GET: APIRoute = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard instanceof Response) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const since = Number(ctx.url.searchParams.get("since") ?? "0");
  const appId = readEnv("PUBLIC_SITE_AMPLIFY_APP_ID");
  const accessKeyId = readEnv("AMPLIFY_READER_ACCESS_KEY_ID");
  const secretKey = readEnv("AMPLIFY_READER_SECRET_ACCESS_KEY");

  // Surface which specific var is missing so the client toast tells the
  // operator exactly what to set in Amplify env config — instead of just
  // "no_amplify_configured" with no signal of which one.
  if (!appId || !accessKeyId || !secretKey) {
    const missing = [
      !appId && "PUBLIC_SITE_AMPLIFY_APP_ID",
      !accessKeyId && "AMPLIFY_READER_ACCESS_KEY_ID",
      !secretKey && "AMPLIFY_READER_SECRET_ACCESS_KEY",
    ].filter(Boolean);
    return Response.json({
      phase: "unavailable",
      reason: "no_amplify_configured",
      message: `Missing env: ${missing.join(", ")}`,
    });
  }

  try {
    const result = await getClient(accessKeyId, secretKey).send(new ListJobsCommand({
      appId,
      branchName: readEnv("AMPLIFY_BRANCH") ?? "main",
      maxResults: 5,
    }));

    const jobs = (result.jobSummaries ?? [])
      .filter((j) => j.startTime)
      .sort((a, b) => (b.startTime!.getTime() - a.startTime!.getTime()));

    // Find the first job that started at or after `since` (10s tolerance for clock skew).
    const tolerance = 10_000;
    const job = jobs.find((j) => j.startTime!.getTime() >= since - tolerance);

    if (!job) {
      // No job dispatched yet — the DB trigger may still be firing or in flight.
      return Response.json({ phase: "pending" });
    }

    const phase =
      job.status === "SUCCEED" ? "succeed" :
      job.status === "FAILED" || job.status === "CANCELLED" ? "failed" :
      "running";

    return Response.json({
      phase,
      jobId: job.jobId,
      status: job.status,
      startTime: job.startTime?.toISOString(),
      endTime: job.endTime?.toISOString(),
    });
  } catch (err) {
    // Non-fatal — the client polls again in 3-5s. Don't return 500 here
    // because it makes the status bar look broken in dev tools; treat
    // transient AWS errors as "unavailable" and let the polling continue.
    return Response.json({
      phase: "unavailable",
      reason: "amplify_query_failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
