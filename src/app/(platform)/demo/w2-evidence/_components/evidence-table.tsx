import type { ReactNode } from "react";
import { EvidenceLabelBadge } from "@/components/evidence/evidence-label-badge";
import { Badge, SyntheticBadge, Withheld } from "@/components/ui";
import type { Compound, EvidenceRef, Observation, Taxon } from "@/lib/demo/types";
import { humanize } from "../../_components/fields";

function Table({
  label,
  headers,
  children,
}: {
  label: string;
  headers: readonly string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto" tabIndex={0} role="group" aria-label={`${label} (scrollable)`}>
      <table className="w-full text-left text-sm" aria-label={label}>
        <thead>
          <tr className="border-b border-border">
            {headers.map((header) => (
              <th key={header} scope="col" className="p-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EvidenceList({ evidence }: { evidence: readonly EvidenceRef[] }) {
  if (evidence.length === 0) return <span className="text-fg-muted">none</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {evidence.map((ref, index) => (
        <EvidenceLabelBadge key={`${ref.label}:${ref.claim_id ?? index}`} label={ref.label} />
      ))}
    </span>
  );
}

const cell = "p-2 align-top";

export function TaxaTable({ items }: { items: readonly Taxon[] }) {
  return (
    <Table
      label="Taxa"
      headers={["Name", "Accepted name", "Synonyms", "Verification", "Evidence", "Withheld"]}
    >
      {items.map((taxon) => (
        <tr key={taxon.id} className="border-b border-border">
          <th scope="row" className={`${cell} font-medium`}>
            {taxon.display_name}
          </th>
          <td className={cell}>{taxon.accepted_name}</td>
          <td className={cell}>{taxon.synonyms.join(", ") || "none"}</td>
          <td className={cell}>{humanize(taxon.verification_status)}</td>
          <td className={cell}>
            <EvidenceList evidence={taxon.evidence} />
          </td>
          <td className={cell}>
            {taxon.withheld_fields.length
              ? taxon.withheld_fields.map((field) => <Withheld key={field} field={field} />)
              : "none"}
          </td>
        </tr>
      ))}
    </Table>
  );
}

export function CompoundsTable({ items }: { items: readonly Compound[] }) {
  return (
    <Table
      label="Compounds"
      headers={["Compound", "Identity status", "Stereochemistry", "Evidence"]}
    >
      {items.map((compound) => (
        <tr key={compound.id} className="border-b border-border">
          <th scope="row" className={`${cell} font-mono`}>
            {compound.display_id}
          </th>
          <td className={cell}>{humanize(compound.identity_status)}</td>
          <td className={cell}>
            {compound.quarantined ? (
              <Badge tone="warning">Quarantined — ambiguous stereochemistry</Badge>
            ) : (
              humanize(compound.stereochemistry_status)
            )}
          </td>
          <td className={cell}>
            <EvidenceList evidence={compound.evidence} />
          </td>
        </tr>
      ))}
    </Table>
  );
}

function Measured({
  observation,
  field,
  children,
}: {
  observation: Observation;
  field: "value" | "concentration_um";
  children: ReactNode;
}) {
  if (observation.withheld_fields.includes(field) || observation[field] === null)
    return <Withheld field={field} />;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {children} <SyntheticBadge />
    </span>
  );
}

export function ObservationsTable({ items }: { items: readonly Observation[] }) {
  return (
    <Table
      label="Observations"
      headers={[
        "Endpoint",
        "Target",
        "Value",
        "Concentration (µM)",
        "Replicate",
        "Evidence",
        "Revision",
      ]}
    >
      {items.map((o) => (
        <tr
          key={o.id}
          className="border-b border-border"
          data-withheld={o.withheld_fields.length > 0 ? "true" : "false"}
        >
          <th scope="row" className={`${cell} font-medium`}>
            {o.endpoint}
          </th>
          <td className={cell}>{o.target_id}</td>
          <td className={cell}>
            <Measured
              observation={o}
              field="value"
            >{`${o.qualifier} ${o.value} ${o.units}`}</Measured>
          </td>
          <td className={cell}>
            <Measured observation={o} field="concentration_um">
              {o.concentration_um}
            </Measured>
          </td>
          <td className={cell}>{o.replicate_index}</td>
          <td className={cell}>
            <span className="flex flex-wrap gap-1">
              <EvidenceLabelBadge label={o.evidence_label} />
              {o.out_of_domain ? <Badge tone="warning">Out of domain</Badge> : null}
            </span>
          </td>
          <td className={cell}>
            {o.revision}
            {o.superseded ? " (superseded)" : ""}
          </td>
        </tr>
      ))}
    </Table>
  );
}
