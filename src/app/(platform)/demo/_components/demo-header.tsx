import type { DemoSession } from "@/lib/demo/types";
import { personaLabel } from "@/lib/personas";
import { Wordmark } from "@/components/site/wordmark";
import { PersonaSwitcher } from "./persona-switcher";
import { ResetButton } from "./reset-button";
import { SignOutButton } from "./sign-out-button";

// One quiet row: the lockup on the left, who you are and the session controls on the right.
export function DemoHeader({ session }: { session: DemoSession }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-5 py-3 md:px-6">
      <Wordmark href="/demo" label="NEWMA demo" imageClassName="h-8 w-auto">
        <span className="place rounded-full border border-fg/30 px-1.5 py-0.5 text-[0.625rem]">
          Demo
        </span>
      </Wordmark>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="flex items-baseline gap-2 text-sm">
          <span className="text-fg-muted">Signed in as</span>
          <strong data-testid="current-persona" className="font-medium">
            {personaLabel(session.persona)}
          </strong>
          <span className="gridref text-fg-muted">Demo sign-in</span>
        </p>
        <PersonaSwitcher persona={session.persona} />
        <ResetButton />
        <SignOutButton />
      </div>
    </header>
  );
}
