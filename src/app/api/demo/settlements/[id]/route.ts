import { getById } from "@/lib/demo/w7-routes";

/** GET: one poll of a settlement (the page polls only while an anchor is pending). */
export const GET = getById("settlements");
