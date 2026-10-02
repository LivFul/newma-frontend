import { readJson, withSession } from "@/lib/demo/bff";
import { parseIngestion } from "@/lib/demo/parse-curation";
import { proxy, validationError } from "@/lib/demo/proxy";

/** POST: ingest a source record; an uncleared source is a 409 source_not_cleared with reasons. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseIngestion(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/ingestion/runs", { method: "POST", body, sessionId });
});
