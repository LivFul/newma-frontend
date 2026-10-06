import Link from "next/link";
import { Badge } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireSession } from "@/lib/demo/current-session";
import { WORKFLOWS, type Workflow } from "@/lib/demo/workflows";
import { personaLabel } from "@/lib/personas";

function formatInstant(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toUTCString();
}

const ROW = "flex min-h-16 items-center gap-4 border-t border-fg/15 px-2 py-3";
// Only a link row reacts: hover and keyboard focus look the same, and a row that goes nowhere stays still.
const ROW_LINK = "group transition-colors hover:bg-bg-deep focus-visible:bg-bg-deep";

function WorkflowRow({ workflow }: { workflow: Workflow }) {
  const content = (
    <>
      <span className="inline-grid min-w-12 place-items-center border border-fg py-1 font-mono text-xs group-hover:bg-fg group-hover:text-bg group-focus-visible:bg-fg group-focus-visible:text-bg">
        {workflow.id}
      </span>
      <span className="flex-1 text-lg tracking-[-0.01em]">{workflow.title}</span>
      <Badge tone={workflow.href ? "neutral" : "warning"}>
        {workflow.href ? "Available" : `Arrives in ${workflow.phase}`}
      </Badge>
    </>
  );
  return workflow.href ? (
    <Link href={workflow.href} className={`${ROW} ${ROW_LINK}`}>
      {content}
    </Link>
  ) : (
    <div className={ROW}>{content}</div>
  );
}

export default async function DemoDashboard() {
  const session = await requireSession();
  return (
    <>
      <section aria-labelledby="session-heading" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-fg pb-6">
          <h1 id="session-heading" className="text-3xl font-medium tracking-[-0.025em] md:text-4xl">
            Dashboard
          </h1>
          <div className="flex flex-wrap gap-3">
            <Link href="/demo/jobs" className={buttonVariants({ variant: "secondary" })}>
              Open simulated jobs
            </Link>
            <Link href="/demo/tour" className={buttonVariants({ variant: "primary" })}>
              Guided tour
            </Link>
          </div>
        </div>
        <dl className="surface grid gap-6 px-6 py-5 text-sm sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-fg-muted">Persona</dt>
            <dd className="text-lg font-medium">{personaLabel(session.persona)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-fg-muted">Tenant</dt>
            <dd className="gridref break-all text-fg">{session.tenant_id}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-fg-muted">Session expires</dt>
            <dd className="tabular">
              <time dateTime={session.expires_at}>{formatInstant(session.expires_at)}</time>
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="workflows-heading" className="space-y-4">
        <h2 id="workflows-heading" className="text-2xl font-medium tracking-[-0.015em]">
          Workflows
        </h2>
        <ul className="grid list-none gap-x-10 p-0 lg:grid-cols-2">
          {WORKFLOWS.map((workflow) => (
            <li key={workflow.id}>
              <WorkflowRow workflow={workflow} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
