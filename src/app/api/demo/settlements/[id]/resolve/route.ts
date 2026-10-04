import { parseResolve } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: reinstate a disputed receipt (A15). */
export const POST = postAction("settlements", "resolve", parseResolve);
