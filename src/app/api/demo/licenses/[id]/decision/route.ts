import { parseLicenseDecision } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: approve or deny (A6); a refused approval is forwarded with its allow-listed details. */
export const POST = postAction("licenses", "decision", parseLicenseDecision);
