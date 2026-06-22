import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handleApiRequest } from "../../../../src/lib/server/api";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function dispatch(request: Request, context: RouteContext): Promise<Response> {
  const { env } = await getCloudflareContext({ async: true });
  const params = await context.params;
  return handleApiRequest(request, params.path ?? [], env);
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return dispatch(request, context);
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return dispatch(request, context);
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  return dispatch(request, context);
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return dispatch(request, context);
}
