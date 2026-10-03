import type { CustodianObligation } from "@/lib/demo/types";
import { ObligationStatusText } from "../../_components/status-text";

const longDate = (iso: string): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

type Props = Readonly<{ obligations: readonly CustodianObligation[]; title: string }>;

/** Every promise has a status in words ("Done", "Due", "Late") plus the sentence from the server. */
export function ObligationsTable({ obligations, title }: Props) {
  if (obligations.length === 0) {
    return <p className="text-sm">This agreement lists no promises.</p>;
  }
  return (
    <div className="overflow-x-auto" role="group" tabIndex={0} aria-label={`Promises: ${title}`}>
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
              <th scope="row" className="break-words p-2 font-normal">
                {obligation.text}
              </th>
              <td className="p-2">
                {obligation.due_on ? (
                  <time dateTime={obligation.due_on}>{longDate(obligation.due_on)}</time>
                ) : (
                  "No date set"
                )}
              </td>
              <td className="p-2">
                <ObligationStatusText status={obligation.status} />
                <span className="block">{obligation.status_text}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
