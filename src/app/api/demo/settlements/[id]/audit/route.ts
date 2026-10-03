import { parseAudit } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: final reconciliation, signed commitment and optional anchoring (A20). */
export const POST = postAction("settlements", "audit", parseAudit);
