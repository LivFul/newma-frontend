import { parseSchedule } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: planned to scheduled (A22). */
export const POST = postAction("benefits", "schedule", parseSchedule);
