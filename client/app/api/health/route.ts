import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(): Promise<Response> {
  const { env } = await getCloudflareContext({ async: true });
  return Response.json({
    ok: true,
    runtime: "cloudflare-workers",
    hasDatabaseBinding: Boolean(env.DB),
    timestamp: new Date().toISOString(),
  });
}
