import { Wordmark } from "@/components/site/wordmark";
import { LeafIcon } from "@/components/brand/leaf-icon";
import { PERSONAS, type Persona } from "@/lib/personas";

const SESSIONS_ACTION = "/api/demo/sessions";

const REASON_MESSAGES: Readonly<Record<string, string>> = {
  expired: "Your demo session has expired. Pick a persona to start a new one.",
  invalid: "That persona was not recognised. Pick one of the personas below.",
  disabled: "Demo sign-in is not enabled on this deployment.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function reasonMessage(reason: string | string[] | undefined): string | undefined {
  return typeof reason === "string" ? REASON_MESSAGES[reason] : undefined;
}

function PersonaForm({ persona }: { persona: Persona }) {
  return (
    <form method="post" action={SESSIONS_ACTION}>
      <input type="hidden" name="persona" value={persona.id} />
      <button
        type="submit"
        className="group grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 rounded-lg px-3 py-4 text-left transition-colors hover:bg-fg hover:text-bg focus-visible:bg-fg focus-visible:text-bg"
      >
        <span className="text-lg font-medium tracking-[-0.01em]">{persona.label}</span>
        <LeafIcon className="row-span-2 h-5 w-auto opacity-40 transition-opacity group-hover:opacity-100" />
        <span className="text-sm text-fg-muted group-hover:text-bg/80 group-focus-visible:text-bg/80">
          {persona.description}
        </span>
      </button>
    </form>
  );
}

export default async function AccessPage({ searchParams }: { searchParams: SearchParams }) {
  const message = reasonMessage((await searchParams).reason);
  return (
    <main id="main" tabIndex={-1} className="flex min-h-full flex-1 flex-col aurora">
      <div className="grid w-full flex-1 lg:grid-cols-12">
        <header className="flex flex-col gap-8 px-6 py-10 md:px-12 md:py-14 lg:col-span-5">
          <Wordmark />
          <div className="space-y-5">
            <h1 className="font-display text-5xl leading-none font-medium tracking-[-0.035em] md:text-6xl">
              Demo sign-in
            </h1>
            <p className="max-w-[42ch] text-lg leading-relaxed text-fg-muted">
              Pick a persona to receive a demo session. No passwords are used: this stands in for
              platform identity and every record you will see is synthetic.
            </p>
          </div>
          {message ? (
            <p
              role="status"
              className="max-w-[42ch] rounded-lg border border-warning-ink bg-warning/15 px-4 py-3"
            >
              {message}
            </p>
          ) : null}
        </header>
        <div className="px-3 py-6 md:px-8 md:py-10 lg:col-span-7">
          <ul role="list" className="list-none space-y-1 p-0">
            {PERSONAS.map((persona) => (
              <li key={persona.id}>
                <PersonaForm persona={persona} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
