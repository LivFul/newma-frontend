import { parseDispute } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: dispute one receipt (A14); nothing is payable until resolved. */
export const POST = postAction("settlements", "dispute", parseDispute);
