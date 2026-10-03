import { parseRationaleRequest } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: evidence approval (A16). */
export const POST = postAction("settlements", "evidence-approval", parseRationaleRequest);
