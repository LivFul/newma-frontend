import { parseReceipt } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: record a receipt in demo credits (A12); a duplicate is a committed 409. */
export const POST = postAction("settlements", "receipts", parseReceipt);
