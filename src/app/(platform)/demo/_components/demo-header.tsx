import Link from "next/link";
import type { DemoSession } from "@/lib/demo/types";
import { personaLabel } from "@/lib/personas";
import { PersonaSwitcher } from "./persona-switcher";
import { ResetButton } from "./reset-button";
import { SignOutButton } from "./sign-out-button";

// One quiet row: the sheet title on the left, who you are and the session controls on the right.
export function DemoHeader({ session }: { session: DemoSession }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-fg px-5 py-3 md:px-6">
      <Link href="/demo" className="inline-flex min-h-11 items-center gap-2 text-base">
        <span>LivFul</span>
        <span aria-hidden="true" className="h-5 w-px bg-fg/40" />
        <span className="font-display font-semibold tracking-[0.12em]">NEWMA</span>
        <span className="place ml-2 border border-fg px-1.5 py-0.5 text-[0.625rem]">Demo</span>
      </Link>
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
