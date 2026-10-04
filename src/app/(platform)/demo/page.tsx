import Link from "next/link";
import { Badge } from "@/components/ui";
import { requireSession } from "@/lib/demo/current-session";
import { WORKFLOWS, type Workflow } from "@/lib/demo/workflows";
import { personaLabel } from "@/lib/personas";

function formatInstant(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toUTCString();
}

function WorkflowName({ workflow }: { workflow: Workflow }) {
  const content = (
    <span className="flex items-baseline gap-2">
      <span className="font-mono text-sm text-fg-muted">{workflow.id}</span>
      <span>{workflow.title}</span>
    </span>
  );
  return workflow.href ? (
    <Link href={workflow.href} className="underline-offset-4 hover:underline">
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function DemoDashboard() {
  const session = await requireSession();
  return (
    <>
      <section aria-labelledby="session-heading" className="space-y-3">
        <h1 id="session-heading" className="text-2xl font-semibold">
          Dashboard
        </h1>
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-fg-muted">Persona</dt>
            <dd className="font-medium">{personaLabel(session.persona)}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Tenant</dt>
            <dd className="font-mono">{session.tenant_id}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Session expires</dt>
            <dd>
              <time dateTime={session.expires_at}>{formatInstant(session.expires_at)}</time>
            </dd>
          </div>
        </dl>
        <p>
          <Link href="/demo/jobs" className="underline underline-offset-4">
            Open simulated jobs
          </Link>
        </p>
        <p>
          <Link href="/demo/tour" className="underline underline-offset-4">
            Guided tour
          </Link>
        </p>
      </section>
      <section aria-labelledby="workflows-heading" className="space-y-3">
        <h2 id="workflows-heading" className="text-xl font-semibold">
          Workflows
        </h2>
        <ul className="grid list-none gap-2 p-0 sm:grid-cols-2">
          {WORKFLOWS.map((workflow) => (
            <li
              key={workflow.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
            >
              <WorkflowName workflow={workflow} />
              <Badge tone={workflow.href ? "success" : "neutral"}>
                {workflow.href ? "Available" : `Arrives in ${workflow.phase}`}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
