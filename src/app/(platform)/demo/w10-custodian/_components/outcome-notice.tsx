import {
  GRIEVANCE_REDIRECT_ERRORS,
  type GrievanceRedirectError,
} from "@/lib/demo/parse-grievances";
import { isSafeId } from "@/lib/demo/safe-id";

export const VALIDATION_TEXT =
  "Please describe your concern in at least 10 characters and at most 1000.";

const ERROR_TEXT: Readonly<Record<GrievanceRedirectError, string>> = {
  persona_forbidden: "Only a community liaison can send a concern. Switch persona in the header.",
  validation_error: VALIDATION_TEXT,
  not_found: "We could not find that agreement or promise. Please try again.",
  idempotency_conflict:
    "This concern was already sent with different words. Please write it again.",
  upstream_error: "The service is not available right now. Please try again in a moment.",
};

const knownError = (value: string | undefined): GrievanceRedirectError | undefined =>
  GRIEVANCE_REDIRECT_ERRORS.find((code) => code === value);

type Props = Readonly<{
  raised: string | undefined;
  error: string | undefined;
  /** Whether the new concern is really in the list (a hand-typed ?raised= shows no success). */
  raisedKnown?: boolean;
}>;

/**
 * The result of the last form post, from the redirect. The redirect ends in #outcome, so a plain
 * page load puts the reader here: the section takes focus without JavaScript and is read from its
 * heading (content present at load is not announced by a live region alone).
 */
export function OutcomeNotice({ raised, error, raisedKnown = true }: Props) {
  const code = knownError(error);
  const sent = raised !== undefined && isSafeId(raised) && raisedKnown;
  if (!sent && !code) return <div role="status" />;
  return (
    <section
      id="outcome"
      tabIndex={-1}
      aria-labelledby="outcome-heading"
      className="scroll-mt-4 space-y-1 rounded-md border border-border-strong px-3 py-2"
    >
      <h2 id="outcome-heading" className="font-semibold">
        {sent ? "Your concern was sent" : "We could not send your concern"}
      </h2>
      {sent ? (
        <p role="status">Your concern was sent. It is listed under the agreement below.</p>
      ) : (
        <p role="alert">{ERROR_TEXT[code!]}</p>
      )}
    </section>
  );
}
