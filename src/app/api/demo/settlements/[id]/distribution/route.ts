import { parseKeyOnly } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: fund and pay in demo credits (A19). */
export const POST = postAction("settlements", "distribution", parseKeyOnly);
