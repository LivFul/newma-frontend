import { parseDeliver } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: scheduled to delivered with an evidence note (A23). */
export const POST = postAction("benefits", "deliver", parseDeliver);
