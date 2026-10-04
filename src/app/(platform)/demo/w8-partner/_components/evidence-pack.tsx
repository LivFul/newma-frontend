import { Badge } from "@/components/ui/badge";
import { SyntheticBadge } from "@/components/ui/synthetic-badge";
import type { AssetEvidence } from "@/lib/demo/types";
import { FieldDisclosureTable } from "../../_components/field-disclosure";

/** The partner's view of one stage package: disclosed fields and withheld fields with reasons. */
export function EvidencePack({ pack }: { pack: AssetEvidence }) {
  const disclosed = pack.fields.filter((field) => field.status === "disclosed");
  const withheld = pack.fields.filter((field) => field.status === "withheld");
  return (
    <section aria-labelledby="pack-heading" className="space-y-4">
      <h2 id="pack-heading" className="flex flex-wrap items-center gap-2 text-xl font-semibold">
        Evidence pack {pack.display_id} <SyntheticBadge />
      </h2>
      <dl className="grid gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-fg-muted">Stage</dt>
          <dd className="font-mono">{pack.requested_stage ?? pack.stage ?? "none"}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Gate status</dt>
          <dd>{pack.gate_status ?? "none"}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Package version</dt>
          <dd>{pack.package_version ?? "none"}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Release</dt>
          <dd>
            <Badge tone={pack.released ? "success" : "warning"}>
              {pack.released ? "released" : "not released"}
            </Badge>
          </dd>
        </div>
      </dl>
      {pack.not_released_reason ? (
        <p className="text-sm">
          <span className="font-mono">{pack.not_released_reason.code}</span>:{" "}
          {pack.not_released_reason.message}
        </p>
      ) : null}
      {pack.content_sha256 ? (
        <p className="break-all font-mono text-xs text-fg-muted">sha256 {pack.content_sha256}</p>
      ) : null}
      <h3 className="text-lg font-semibold">Disclosed fields ({disclosed.length})</h3>
      <FieldDisclosureTable
        caption="Disclosed fields"
        rows={disclosed}
        emptyText="No fields are disclosed for this stage."
      />
      <h3 className="text-lg font-semibold">Withheld fields ({withheld.length})</h3>
      <FieldDisclosureTable
        caption="Withheld fields"
        rows={withheld}
        emptyText="No fields are withheld."
      />
    </section>
  );
}
