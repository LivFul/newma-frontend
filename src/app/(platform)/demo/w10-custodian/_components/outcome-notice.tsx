import {
  GRIEVANCE_REDIRECT_ERRORS,
  type GrievanceRedirectError,
} from "@/lib/demo/parse-grievances";
import { isSafeId } from "@/lib/demo/safe-id";

const ERROR_TEXT: Readonly<Record<GrievanceRedirectError, string>> = {
  persona_forbidden: "Only a community liaison can send a concern. Switch persona in the header.",
  validation_error: "Please describe your concern in at least 10 characters.",
  not_found: "We could not find that agreement or promise. Please try again.",
  idempotency_conflict:
    "This concern was already sent with different words. Please write it again.",
  upstream_error: "The service is not available right now. Please try again in a moment.",
};

const knownError = (value: string | undefined): GrievanceRedirectError | undefined =>
  GRIEVANCE_REDIRECT_ERRORS.find((code) => code === value);

type Props = Readonly<{ raised: string | undefined; error: string | undefined }>;

/** The result of the last form post, from the redirect: a sent concern or an allow-listed error. */
export function OutcomeNotice({ raised, error }: Props) {
  const code = knownError(error);
  const sent = raised !== undefined && isSafeId(raised);
  return (
    <>
      <div role="status" aria-live="polite">
        {sent ? (
          <p className="rounded-md border border-border-strong px-3 py-2">Your concern was sent.</p>
        ) : null}
      </div>
      {code ? (
        <p role="alert" className="rounded-md border border-danger px-3 py-2">
          {ERROR_TEXT[code]}
        </p>
      ) : null}
    </>
  );
}
