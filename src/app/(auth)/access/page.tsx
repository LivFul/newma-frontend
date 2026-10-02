import { Button } from "@/components/ui";
import { PERSONAS, type Persona } from "@/lib/personas";

// Persona sign-in (prompt §3.1 "Demo sign-in"; IP C-13 stand-in). Plain form posts to the BFF keep
// this page free of demo imports and of client JS (assumption A-P2-F01). The handler only ever
// redirects to /demo (P2 review focus 5).
const SESSIONS_ACTION = "/api/demo/sessions";

const REASON_MESSAGES: Readonly<Record<string, string>> = {
  expired: "Your demo session has expired. Pick a persona to start a new one.",
  invalid: "That persona was not recognised. Pick one of the personas below.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function reasonMessage(reason: string | string[] | undefined): string | undefined {
  return typeof reason === "string" ? REASON_MESSAGES[reason] : undefined;
}

function PersonaForm({ persona }: { persona: Persona }) {
  return (
    <form method="post" action={SESSIONS_ACTION} className="contents">
      <input type="hidden" name="persona" value={persona.id} />
      <Button
        type="submit"
        variant="secondary"
        className="h-full w-full flex-col items-start gap-1 px-4 py-3 text-left"
      >
        <span className="text-base font-semibold">{persona.label}</span>
        <span className="text-sm font-normal text-fg-muted">{persona.description}</span>
      </Button>
    </form>
  );
}

export default async function AccessPage({ searchParams }: { searchParams: SearchParams }) {
  const message = reasonMessage((await searchParams).reason);
  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 space-y-8 p-6 sm:p-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-fg-muted">NEWMA demo</p>
        <h1 className="text-3xl font-semibold">Demo sign-in</h1>
        <p className="text-fg-muted">
          Pick a persona to receive a demo session. No passwords are used: this stands in for
          platform identity and every record you will see is synthetic.
        </p>
      </header>
      {message ? (
        <p role="status" className="rounded-md border border-warning bg-bg-elevated px-4 py-3">
          {message}
        </p>
      ) : null}
      <ul className="grid list-none gap-3 p-0 sm:grid-cols-2" aria-label="Personas">
        {PERSONAS.map((persona) => (
          <li key={persona.id}>
            <PersonaForm persona={persona} />
          </li>
        ))}
      </ul>
    </main>
  );
}
