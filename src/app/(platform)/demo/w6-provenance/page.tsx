import { redirect } from "next/navigation";
import { isEntityType } from "@/lib/demo/parse-provenance";
import { isSafeId } from "@/lib/demo/safe-id";
import { load } from "@/lib/demo/server-data";
import type { Candidate, CandidateGates, Items, RightsRecord } from "@/lib/demo/types";
import { ErrorNotice } from "../_components/error-notice";
import { SimulatedLabel } from "../_components/simulated-label";
import { WorkflowHeader } from "../_components/workflow-header";
import { type EntityLink, EntityLinks, EntityLookup } from "./_components/entity-picker";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function gateLinks(candidates: readonly Candidate[]): Promise<readonly EntityLink[]> {
  const results = await Promise.all(
    candidates.map((c) => load<CandidateGates>(`/v1/candidates/${c.id}/gates`)),
  );
  return results.flatMap((result, index) =>
    (result.data?.gates ?? [])
      .filter((gate) => gate.decided_at !== null)
      .map((gate) => ({
        entityType: "gate",
        entityId: gate.id,
        label: `${candidates[index].display_id} ${gate.stage} (${gate.status})`,
      })),
  );
}

export default async function ProvenancePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const type = first(params.type);
  const id = first(params.id)?.trim();
  if (type && id && isEntityType(type) && isSafeId(id))
    redirect(`/demo/w6-provenance/${type}/${id}`);
  const [rights, candidates] = await Promise.all([
    load<Items<RightsRecord>>("/v1/rights/records"),
    load<Items<Candidate>>("/v1/candidates"),
  ]);
  const gates = await gateLinks(candidates.data?.items ?? []);
  const rightsLinks = (rights.data?.items ?? []).map((r) => ({
    entityType: "rights_record",
    entityId: r.id,
    label: `${r.subject_display_name} (${r.status})`,
  }));
  return (
    <>
      <WorkflowHeader
        id="W6"
        title="Signed provenance"
        labels={<SimulatedLabel label="Demo signature, not production key" />}
      >
        Every governed action appends a signed, append-only event. Inspect an entity&apos;s
        timeline, recompute the hash in your browser and verify the demo signature.
      </WorkflowHeader>
      <ErrorNotice error={rights.error ?? candidates.error} />
      {type && id ? (
        <p role="alert" className="text-sm text-danger">
          Choose a known entity type and a valid id.
        </p>
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2">
        <EntityLinks title="Decided gates" links={gates} />
        <EntityLinks title="Rights records" links={rightsLinks} />
      </div>
      <section aria-labelledby="lookup-heading" className="space-y-2">
        <h2 id="lookup-heading" className="text-xl font-semibold">
          Any entity
        </h2>
        <EntityLookup />
      </section>
    </>
  );
}
