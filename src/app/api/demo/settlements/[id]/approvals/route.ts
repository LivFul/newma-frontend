import { parseApproval } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: one of two distinct-persona approvals (A18). */
export const POST = postAction("settlements", "approvals", parseApproval);
