import { requireSession } from "@/lib/demo/current-session";
import { canAct } from "@/lib/demo/persona-actions";
import { load } from "@/lib/demo/server-data";
import {
  EXPORT_PURPOSES,
  GATE_STAGES,
  type AssetEvidence,
  type Candidate,
  type ExportPurpose,
  type ExportSummary,
  type GateStage,
  type Items,
  type RightsRecord,
} from "@/lib/demo/types";
import type { PersonaId } from "@/lib/personas";
import { ErrorNotice } from "../_components/error-notice";
import { PersonaForbiddenNotice } from "../_components/persona-forbidden-notice";
import { SimulatedLabel } from "../_components/simulated-label";
import { WorkflowHeader } from "../_components/workflow-header";
import { AssetPicker } from "./_components/asset-picker";
import { EvidencePack } from "./_components/evidence-pack";
import { ExportForm } from "./_components/export-form";
import { ExportRegister } from "./_components/export-register";
import { GoverningRights } from "./_components/governing-rights";
import { StageTabs } from "./_components/stage-tabs";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const asPurpose = (value: string | undefined): ExportPurpose =>
  EXPORT_PURPOSES.find((p) => p === value) ?? "research";
const asStage = (value: string | undefined): GateStage | undefined =>
  GATE_STAGES.find((s) => s === value);

type WorkspaceProps = Readonly<{
  asset: string;
  stage: GateStage | undefined;
  purpose: ExportPurpose;
  persona: PersonaId;
}>;

// Pack, rights and register are read in parallel; the backend's persona_forbidden is rendered as is.
async function loadWorkspace({ asset, stage, purpose }: WorkspaceProps) {
  const [pack, exports, records] = await Promise.all([
    load<AssetEvidence>(`/v1/assets/${encodeURIComponent(asset)}/evidence`, {
      query: { stage, purpose },
    }),
    load<Items<ExportSummary>>("/v1/exports"),
    load<Items<RightsRecord>>("/v1/rights/records"),
  ]);
  const names = Object.fromEntries(
    (records.data?.items ?? []).map((r) => [r.id, r.subject_display_name]),
  );
  return { pack, exports, names };
}

type WorkspaceData = Awaited<ReturnType<typeof loadWorkspace>>;

function Workspace(props: WorkspaceProps & { data: WorkspaceData }) {
  const { asset, purpose, persona, data: loaded } = props;
  const { pack, exports, names } = loaded;
  const data = pack.data;
  return (
    <>
      <ErrorNotice error={pack.error} />
      {canAct(persona, "view_exports") ? null : (
        <PersonaForbiddenNotice allowed={["partner", "tenant_admin"]} />
      )}
      {data ? (
        <>
          <StageTabs pack={data} asset={asset} purpose={purpose} />
          <EvidencePack pack={data} />
          <GoverningRights policy={data.policy} recordNames={names} />
          <ExportForm
            key={`${data.asset_id}:${data.requested_stage ?? data.stage}:${data.purpose}`}
            pack={data}
            allowed={canAct(persona, "export_evidence")}
          />
        </>
      ) : null}
      <section aria-labelledby="register-heading" className="space-y-3">
        <h2 id="register-heading" className="text-xl font-semibold">
          Export register
        </h2>
        <ErrorNotice error={exports.error} />
        <ExportRegister exports={exports.data?.items ?? []} />
      </section>
    </>
  );
}

export default async function PartnerPage({ searchParams }: { searchParams: SearchParams }) {
  const [session, params, candidates] = await Promise.all([
    requireSession(),
    searchParams,
    load<Items<Candidate>>("/v1/candidates"),
  ]);
  const items = [...(candidates.data?.items ?? [])].sort((a, b) => a.rank - b.rank);
  const purpose = asPurpose(first(params.purpose));
  // Only an id from the candidate list is ever sent on: a hand-edited ?asset falls back to rank 1.
  const asset = items.find((c) => c.id === first(params.asset))?.id ?? items[0]?.id;
  const workspace = {
    asset: asset ?? "",
    stage: asStage(first(params.stage)),
    purpose,
    persona: session.persona,
  };
  const data = asset ? await loadWorkspace(workspace) : undefined;
  return (
    <>
      <WorkflowHeader
        id="W8"
        title="Partner portal & controlled export"
        labels={<SimulatedLabel label="Demo signature, not production key" />}
      >
        A partner sees the evidence a rights decision allows, and issues a controlled export for a
        fictional recipient with a purpose and an expiry. Restricted fields are withheld, never
        masked.
      </WorkflowHeader>
      <section aria-labelledby="assets-heading" className="space-y-3">
        <h2 id="assets-heading" className="text-xl font-semibold">
          Assets
        </h2>
        <ErrorNotice error={candidates.error} />
        <AssetPicker candidates={items} selected={asset} purpose={purpose} />
      </section>
      {data ? <Workspace {...workspace} data={data} /> : null}
    </>
  );
}
