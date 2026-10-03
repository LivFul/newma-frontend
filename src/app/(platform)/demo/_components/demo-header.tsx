import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { DemoSession } from "@/lib/demo/types";
import { personaLabel } from "@/lib/personas";
import { PersonaSwitcher } from "./persona-switcher";
import { ResetButton } from "./reset-button";
import { SignOutButton } from "./sign-out-button";

export function DemoHeader({ session }: { session: DemoSession }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/demo" className="text-lg font-semibold">
          NEWMA demo
        </Link>
        <nav aria-label="Demo sections" className="flex gap-3 text-sm">
          <Link href="/demo/jobs" className="underline-offset-4 hover:underline">
            Jobs
          </Link>
        </nav>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-fg-muted">Signed in as</span>
          <span className="flex items-center gap-2">
            <strong data-testid="current-persona">{personaLabel(session.persona)}</strong>
            <Badge>Demo sign-in</Badge>
          </span>
        </div>
        <PersonaSwitcher persona={session.persona} />
        <ResetButton />
        <SignOutButton />
      </div>
    </header>
  );
}
