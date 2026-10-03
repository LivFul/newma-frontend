import type { CustodianObligation } from "@/lib/demo/types";
import { ObligationStatusText } from "../../_components/status-text";

type Props = Readonly<{ obligations: readonly CustodianObligation[]; title: string }>;

/** Every promise has a status in words ("Done", "Due", "Late") plus the sentence from the server. */
export function ObligationsTable({ obligations, title }: Props) {
  if (obligations.length === 0) {
    return <p className="text-sm">This agreement lists no promises.</p>;
  }
  return (
    <table className="w-full text-left text-sm">
      <caption className="pb-2 text-left font-medium">Promises in the agreement: {title}</caption>
      <thead>
        <tr className="border-b border-border">
          <th scope="col" className="p-2">
            What was promised
          </th>
          <th scope="col" className="p-2">
            Due
          </th>
          <th scope="col" className="p-2">
            Where it stands
          </th>
        </tr>
      </thead>
      <tbody>
        {obligations.map((obligation) => (
          <tr
            key={obligation.id}
            data-testid="obligation-row"
            className="border-b border-border align-top"
          >
            <th scope="row" className="p-2 font-normal">
              {obligation.text}
            </th>
            <td className="p-2">{obligation.due_on ?? "No date set"}</td>
            <td className="p-2">
              <ObligationStatusText status={obligation.status} />
              <span className="block">{obligation.status_text}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
