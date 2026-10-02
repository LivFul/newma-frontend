import createClient, { type Client } from "openapi-fetch";
import type { paths } from "@/lib/api/generated/schema";

export type ApiClientOptions = {
  baseUrl: string;
  serviceToken: string;
  sessionId?: string;
  fetch?: typeof fetch;
};

export type ApiClient = Client<paths>;

export function createApiClient({
  baseUrl,
  serviceToken,
  sessionId,
  fetch,
}: ApiClientOptions): ApiClient {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${serviceToken}`,
    ...(sessionId ? { "X-Demo-Session": sessionId } : {}),
  };
  return createClient<paths>({ baseUrl, headers, fetch });
}
