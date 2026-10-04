import { getById } from "@/lib/demo/w7-routes";

/** GET: signed events; the seeded example has none and the backend answers 404. */
export const GET = getById("settlements", "/events");
