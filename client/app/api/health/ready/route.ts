import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(): Promise<Response> {
  const { env } = await getCloudflareContext({ async: true });
  if (env.DB) {
    await env.DB.prepare("SELECT 1 AS ok").first();
  }
  return Response.json({
    ok: true,
    status: "ready",
    timestamp: new Date().toISOString(),
  });
}
