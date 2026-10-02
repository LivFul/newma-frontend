import type { PersonaId } from "@/lib/personas";

/** GET /v1/demo/sessions/current (P2 contract). Never includes the session id. */
export type DemoSession = Readonly<{
  persona: PersonaId;
  tenant_id: string;
  expires_at: string;
  created_at: string;
}>;
