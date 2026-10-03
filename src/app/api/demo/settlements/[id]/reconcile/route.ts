import { parseKeyOnly } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: freeze the calculation (A17). */
export const POST = postAction("settlements", "reconcile", parseKeyOnly);
