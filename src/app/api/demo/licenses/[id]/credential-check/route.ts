import { parseCredentialCheck } from "@/lib/demo/parse-settlement";
import { postAction } from "@/lib/demo/w7-routes";

/** POST: the optional, simulated credential check (A5). */
export const POST = postAction("licenses", "credential-check", parseCredentialCheck);
