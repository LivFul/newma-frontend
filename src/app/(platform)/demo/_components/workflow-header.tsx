import type { ReactNode } from "react";

/** h1 + intro for a workflow page; the banner itself comes from the /demo layout. */
export function WorkflowHeader({
  id,
  title,
  children,
  labels,
}: {
  id: string;
  title: string;
  children?: ReactNode;
  labels?: ReactNode;
}) {
  return (
    <header className="space-y-2">
      <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
        <span className="font-mono text-fg-muted">{id}</span> {title}
        {labels}
      </h1>
      {children ? <div className="text-fg-muted">{children}</div> : null}
    </header>
  );
}
