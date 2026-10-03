import type { ReactNode } from "react";
import type { ClientError } from "@/lib/demo/client";
import { isRecord, isStringArray } from "@/lib/demo/guards";
import { allowedLabels } from "./persona-forbidden-notice";

function allowedFrom(error: ClientError): readonly string[] | undefined {
  if (error.code !== "persona_forbidden" || !isRecord(error.details)) return undefined;
  const { allowed } = error.details;
  return isStringArray(allowed) ? allowed : undefined;
}

/** A backend (or BFF) error envelope, rendered with its code; persona_forbidden names who may act. */
export function ErrorNotice({
  error,
  children,
}: {
  error: ClientError | undefined;
  children?: ReactNode;
}) {
  if (!error) return null;
  const allowed = allowedFrom(error);
  return (
    <div role="alert" className="rounded-md border border-danger px-3 py-2 text-sm">
      <p>
        {error.message} <span className="font-mono">({error.code})</span>
      </p>
      {allowed ? <p>Allowed: {allowedLabels(allowed)}</p> : null}
      {children}
    </div>
  );
}
