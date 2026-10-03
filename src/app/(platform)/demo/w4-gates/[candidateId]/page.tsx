import Link from "next/link";
import { notFound } from "next/navigation";
import { canAct } from "@/lib/demo/persona-actions";
import { requireSession } from "@/lib/demo/current-session";
import { isSafeId } from "@/lib/demo/safe-id";
import { load } from "@/lib/demo/server-data";
import type {
  Candidate,
  CandidateGates,
  EvidenceDiff,
  EvidencePackage,
  Items,
} from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { SimulatedLabel } from "../../_components/simulated-label";
import { WorkflowHeader } from "../../_components/workflow-header";
import { DiffPicker } from "../_components/diff-picker";
import { EvidenceDiffView } from "../_components/evidence-diff";
import { GateWorkspace } from "../_components/gate-workspace";

type Params = Promise<{ candidateId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const VERSION = /^[1-9][0-9]{0,5}$/;
const version = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && VERSION.test(raw) ? Number(raw) : undefined;
};

/** Default diff: the two most recent versions of the same stage, if any stage has two. */
function defaultPair(packages: readonly EvidencePackage[]): readonly [number, number] | undefined {
  const stages = [...new Set(packages.map((p) => p.stage))];
  for (const stage of stages) {
    const versions = packages
      .filter((p) => p.stage === stage)
      .map((p) => p.version)
      .sort((a, b) => a - b);
    if (versions.length >= 2) return [versions[versions.length - 2], versions[versions.length - 1]];
  }
  return undefined;
}

export default async function CandidateGatesPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ candidateId }, query, session] = await Promise.all([
    params,
    searchParams,
    requireSession(),
  ]);
  if (!isSafeId(candidateId)) notFound();
  const [candidates, gates, packages] = await Promise.all([
    load<Items<Candidate>>("/v1/candidates"),
    load<CandidateGates>(`/v1/candidates/${candidateId}/gates`),
    load<Items<EvidencePackage>>(`/v1/candidates/${candidateId}/evidence-packages`),
  ]);
  const candidate = candidates.data?.items.find((c) => c.id === candidateId);
  const pkgs = packages.data?.items ?? [];
  const requested = [version(query.from), version(query.to)] as const;
  const pair =
    requested[0] && requested[1] ? ([requested[0], requested[1]] as const) : defaultPair(pkgs);
  const diff = pair
    ? await load<EvidenceDiff>(`/v1/candidates/${candidateId}/evidence-packages/diff`, {
        query: { from: String(pair[0]), to: String(pair[1]) },
      })
    : undefined;
  const displayId = candidate?.display_id ?? candidateId;
  return (
    <>
      <WorkflowHeader
        id="W4"
        title={`Gates for ${displayId}`}
        labels={<SimulatedLabel label="Demo signature, not production key" />}
      >
        <Link href="/demo/w4-gates" className="underline underline-offset-4">
          All candidates
        </Link>
      </WorkflowHeader>
      <section aria-labelledby="gates-heading" className="space-y-3">
        <h2 id="gates-heading" className="text-xl font-semibold">
          Gate tracker
        </h2>
        <ErrorNotice error={gates.error ?? candidates.error} />
        <GateWorkspace
          gates={gates.data?.gates ?? []}
          packages={pkgs}
          candidateDisplayId={displayId}
          allowed={canAct(session.persona, "decide_gate")}
        />
      </section>
      <section aria-labelledby="diff-heading" className="space-y-3">
        <h2 id="diff-heading" className="text-xl font-semibold">
          Evidence-package diff
        </h2>
        <ErrorNotice error={packages.error ?? diff?.error} />
        {pkgs.length > 0 ? (
          <DiffPicker candidateId={candidateId} packages={pkgs} from={pair?.[0]} to={pair?.[1]} />
        ) : (
          <p className="text-fg-muted">No evidence packages yet.</p>
        )}
        {diff?.data ? <EvidenceDiffView diff={diff.data} /> : null}
      </section>
    </>
  );
}
