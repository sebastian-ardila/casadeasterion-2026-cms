import type { APIRoute } from "astro";
import { AmplifyClient, ListJobsCommand } from "@aws-sdk/client-amplify";
import { requireAdmin } from "~/lib/auth";

let client: AmplifyClient | null = null;
function getClient() {
  if (client) return client;
  client = new AmplifyClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: import.meta.env.AMPLIFY_READER_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.AMPLIFY_READER_SECRET_ACCESS_KEY,
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
  const appId = import.meta.env.PUBLIC_SITE_AMPLIFY_APP_ID;

  if (!appId) {
    return new Response(JSON.stringify({ error: "no_app_configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const result = await getClient().send(new ListJobsCommand({
      appId,
      branchName: "main",
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
    return new Response(JSON.stringify({
      error: "amplify_query_failed",
      message: err instanceof Error ? err.message : String(err),
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
