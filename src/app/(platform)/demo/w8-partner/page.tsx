import type { Metadata } from "next";
import { requireSession } from "@/lib/demo/current-session";
import { canAct } from "@/lib/demo/persona-actions";
import { isSafeId } from "@/lib/demo/safe-id";
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
import { nullWithheldValues } from "@/lib/demo/parse-exports";
import { AssetPicker } from "./_components/asset-picker";
import { EvidencePack } from "./_components/evidence-pack";
import { ExportForm } from "./_components/export-form";
import { ExportRegister } from "./_components/export-register";
import { toExportPackInfo } from "./_components/export-pack-info";
import { GoverningRights } from "./_components/governing-rights";
import { PurposeTabs } from "./_components/purpose-tabs";
import { StageTabs } from "./_components/stage-tabs";

export const metadata: Metadata = { title: "Partner portal & controlled export — NEWMA demo" };

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
  // Server reads bypass the BFF, so withheld values are nulled here as well (Review Focus 2).
  const clean = pack.data ? (nullWithheldValues(pack.data) as AssetEvidence) : undefined;
  return { pack: { ...pack, data: clean }, exports, names };
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
          <PurposeTabs asset={asset} stage={data.requested_stage ?? data.stage} purpose={purpose} />
          <StageTabs pack={data} asset={asset} purpose={purpose} />
          <EvidencePack pack={data} />
          <GoverningRights policy={data.policy} recordNames={names} />
          <ExportForm
            key={`${data.asset_id}:${data.requested_stage ?? data.stage}:${data.purpose}`}
            pack={toExportPackInfo(data)}
            allowed={canAct(persona, "export_evidence")}
            liveStatuses={Object.fromEntries(
              (exports.data?.items ?? []).map((entry) => [entry.id, entry.status]),
            )}
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
  // Only a safe id from the candidate list is ever sent on: a hand-edited or unsafe ?asset falls
  // back to the first safe candidate, and with none the page shows the picker's empty state.
  const safeIds = items.map((c) => c.id).filter(isSafeId);
  const requested = first(params.asset);
  const asset = safeIds.find((id) => id === requested) ?? safeIds[0];
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
