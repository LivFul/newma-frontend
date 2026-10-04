import { Badge, type BadgeProps } from "@/components/ui/badge";
import { SyntheticBadge } from "@/components/ui/synthetic-badge";
import type { RightsRecord, RightsStatus } from "@/lib/demo/types";
import { humanize } from "../../_components/fields";
import { WithdrawDialog } from "./withdraw-dialog";

const STATUS_TONE = {
  valid: "success",
  expired: "warning",
  purpose_restricted: "warning",
  disputed: "warning",
  withdrawn: "danger",
} as const satisfies Record<RightsStatus, NonNullable<BadgeProps["tone"]>>;

const grievanceText = (open: number | undefined): string => (open ? `${open} open` : "None");

const list = (values: readonly string[]) =>
  values.length ? values.map(humanize).join(", ") : "none";

function validity(record: RightsRecord): string {
  return `${record.valid_from} – ${record.valid_until ?? "open-ended"}`;
}

type Props = Readonly<{ records: readonly RightsRecord[]; canWithdraw: boolean }>;

export function RightsTable({ records, canWithdraw }: Props) {
  return (
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="group"
      aria-label="Rights registry (scrollable)"
    >
      <table className="w-full text-left text-sm" aria-label="Rights registry">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="p-2">
              Subject
            </th>
            <th scope="col" className="p-2">
              Authority
            </th>
            <th scope="col" className="p-2">
              Permitted uses
            </th>
            <th scope="col" className="p-2">
              Restrictions
            </th>
            <th scope="col" className="p-2">
              Jurisdiction
            </th>
            <th scope="col" className="p-2">
              Validity
            </th>
            <th scope="col" className="p-2">
              PIC / MAT
            </th>
            <th scope="col" className="p-2">
              Grievances
            </th>
            <th scope="col" className="p-2">
              Status
            </th>
            <th scope="col" className="p-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-b border-border align-top"
              data-testid={`rights-row-${record.status}`}
            >
              <th scope="row" className="p-2 font-medium">
                {record.subject_display_name} <SyntheticBadge />
              </th>
              <td className="p-2">{record.authority}</td>
              <td className="p-2">{list(record.permitted_uses)}</td>
              <td className="p-2 font-mono text-xs">{record.restrictions.join(", ") || "none"}</td>
              <td className="p-2">{record.jurisdiction}</td>
              <td className="p-2">{validity(record)}</td>
              <td className="p-2 font-mono text-xs">
                {record.pic_reference ?? "no PIC"} / {record.mat_reference ?? "no MAT"}
              </td>
              <td className="p-2" data-testid="grievance-indicator">
                {grievanceText(record.open_grievance_count)}
              </td>
              <td className="p-2">
                <Badge tone={STATUS_TONE[record.status]}>{humanize(record.status)}</Badge>
              </td>
              <td className="p-2">
                {record.status === "withdrawn" ? null : (
                  <WithdrawDialog record={record} allowed={canWithdraw} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
