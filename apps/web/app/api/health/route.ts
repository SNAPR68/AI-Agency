import { createApiResponse } from "../../../lib/api";
import { getRuntimeHealthStatus } from "../../../lib/runtime-health";

export async function GET() {
  const runtime = getRuntimeHealthStatus();

  return createApiResponse(runtime);
}
