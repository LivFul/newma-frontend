import type { ReactNode } from "react";

/** h1 + intro for a workflow page; the banner itself comes from the /demo layout. The W-code is set
 *  as a legend key so it matches the workflow rail. */
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
    <header className="space-y-4 border-b border-fg pb-8">
      <h1 className="flex flex-wrap items-center gap-x-4 gap-y-2 text-3xl leading-tight font-medium tracking-[-0.025em] md:text-4xl">
        <span className="inline-grid min-w-12 place-items-center border border-fg px-2 py-1 font-mono text-base tracking-normal">
          {id}
        </span>{" "}
        {title}
        {labels}
      </h1>
      {children ? (
        <div className="max-w-[72ch] text-lg leading-relaxed text-fg-muted">{children}</div>
      ) : null}
    </header>
  );
}
