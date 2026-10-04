import { parseKeyOnly } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: submitted to reviewed (A13). */
export const POST = postAction("settlements", "review", parseKeyOnly);
