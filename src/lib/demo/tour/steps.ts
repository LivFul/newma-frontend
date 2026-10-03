import type { PersonaId } from "@/lib/personas";
import type { TourStepId } from "./step-ids";

// The guided-tour script (D-20, A-P5B-19). Follows sprint plan §9: the homepage link, then the
// workflows W1 to W10 across the personas, W9 last so no earlier job is refused by the quota.
// `tryIt` names the control, `expected` the outcome the visitor should see; the Playwright tour
// driver asserts the same outcomes against the real pages.
export type TourStep = Readonly<{
  id: TourStepId;
  /** "Home" or the workflow id (W1 to W10). */
  workflow: string;
  title: string;
  /** The persona to act as; null when any persona (or none) will do. */
  persona: PersonaId | null;
  route: string;
  tryIt: string;
  expected: string;
  minutes: number;
}>;

export const TOUR_MIN_MINUTES = 12;
export const TOUR_MAX_MINUTES = 15;

const DEMO_PATH = /^\/demo(\/|\?|#|$)/;

/** A route inside the demo app (client navigation); anything else is a plain link. */
export const isDemoStepRoute = (route: string): boolean => DEMO_PATH.test(route);

const steps: readonly TourStep[] = [
  {
    id: "home",
    workflow: "Home",
    title: "Homepage and demo sign-in",
    persona: null,
    route: "/",
    tryIt:
      "Open the homepage, then follow its sign-in link to the demo. This page was your starting point; you are already signed in, so return here and choose Next.",
    expected: "The homepage loads and its demo link leads to the persona sign-in.",
    minutes: 0.5,
  },
  {
    id: "w1-evaluate",
    workflow: "W1",
    title: "Rights and use authorization",
    persona: "community_liaison",
    route: "/demo/w1-rights",
    tryIt: "Evaluate the valid record, then the expired one, both for research and retrieve.",
    expected:
      "Allow with the reason rights_valid_for_purpose and a live cache entry; Hold with a remediation for the expired record.",
    minutes: 0.75,
  },
  {
    id: "w10-concern",
    workflow: "W10",
    title: "Custodian view and a concern",
    persona: "community_liaison",
    route: "/demo/w10-custodian",
    tryIt: "Read the agreements, then send a concern about one obligation.",
    expected:
      "Every obligation shows a status in words, and the page confirms: Your concern was sent.",
    minutes: 1,
  },
  {
    id: "w1-acknowledge",
    workflow: "W1",
    title: "Grievance queue",
    persona: "data_steward",
    route: "/demo/w1-rights",
    tryIt: "Find the concern in the grievance queue and acknowledge it.",
    expected:
      "The record shows an open-concern indicator; the concern's status becomes acknowledged.",
    minutes: 0.5,
  },
  {
    id: "w2-curation",
    workflow: "W2",
    title: "Ingestion and curation",
    persona: "data_steward",
    route: "/demo/w2-evidence?tab=curation",
    tryIt:
      "Ingest the cleared source, approve a claim and publish; then ingest the uncleared source.",
    expected:
      "Release version 1 is shown with all six evidence labels in the legend; the uncleared source is Rejected before ingestion, with reasons.",
    minutes: 1,
  },
  {
    id: "w3-agent",
    workflow: "W3",
    title: "Agentic discovery",
    persona: "scientist",
    route: "/demo/w3-agent",
    tryIt: "Submit the objective with the default budget, then again with a budget of 10.",
    expected:
      "Completed with ranked hypotheses badged Synthetic, a retried-failure notice and a work-package proposal, under the Simulated agent label; the second query is Held with a remediation.",
    minutes: 1.5,
  },
  {
    id: "w4-gates",
    workflow: "W4",
    title: "Scientific review and gates",
    persona: "scientific_approver",
    route: "/demo/w4-gates",
    tryIt: "Sign H1 for the rank-2 candidate with step-up, then open rank 1 and try H2.",
    expected:
      "A signed card reading Demo signature, not production key; H2 is refused with three missing requirements.",
    minutes: 1.25,
  },
  {
    id: "w5-package",
    workflow: "W5",
    title: "Work package and Mock ELN",
    persona: "scientist",
    route: "/demo/w5-wet-lab",
    tryIt: "Create the work package from the W3 proposal with the missing-sample scenario.",
    expected:
      "A Mock ELN record and a running Simulated workflow engine job that reaches results available.",
    minutes: 0.5,
  },
  {
    id: "w5-import",
    workflow: "W5",
    title: "Assay results import",
    persona: "wet_lab_cro",
    route: "/demo/w5-wet-lab",
    tryIt: "Import the assay results.",
    expected:
      "The import is listed with its checksum; reconciliation is on hold for the missing sample.",
    minutes: 0.5,
  },
  {
    id: "w5-accept",
    workflow: "W5",
    title: "Disposition, acceptance and retraining",
    persona: "scientist",
    route: "/demo/w5-wet-lab",
    tryIt: "Record a disposition, accept the import, then look at the retraining proposal.",
    expected:
      "Acceptance is recorded with a reviewed update; retraining reads Blocked pending separate authorization.",
    minutes: 1,
  },
  {
    id: "w6-verify",
    workflow: "W6",
    title: "Signed provenance and tamper check",
    persona: "scientific_approver",
    route: "/demo/w6-provenance",
    tryIt: "Open the H1 decision and Verify, then switch on Demo tamper and Verify again.",
    expected: "Valid, then Invalid: signature_mismatch for the tampered copy.",
    minutes: 1,
  },
  {
    id: "w8-export",
    workflow: "W8",
    title: "Partner evidence pack and export",
    persona: "partner",
    route: "/demo/w8-partner",
    tryIt: "Open the rank-1 pack and issue the export.",
    expected: "The export is issued and the collection location is withheld, with its reason.",
    minutes: 1,
  },
  {
    id: "w7-settlement",
    workflow: "W7",
    title: "Licensing and benefit settlement",
    persona: "finance",
    route: "/demo/w7-settlement",
    tryIt:
      "Open the seeded settlement (receipts, a disputed receipt, reconciliation held), then back on the overview switch on Simulate chain outage (demo). Optional: run a license to a signed commitment with the other personas.",
    expected:
      "The disputed receipt is held, not payable, and nothing is paid; the outage notice says new anchors stay pending (Optional, simulated).",
    minutes: 1.25,
  },
  {
    id: "w1-withdraw",
    workflow: "W1",
    title: "Withdraw consent",
    persona: "community_liaison",
    route: "/demo/w1-rights",
    tryIt: "Withdraw consent for the record named in the W8 policy block.",
    expected: "The record shows withdrawn and its cache entries are invalidated.",
    minutes: 0.5,
  },
  {
    id: "w8-refusal",
    workflow: "W8",
    title: "Export refused after withdrawal",
    persona: "partner",
    route: "/demo/w8-partner",
    tryIt: "Try the export again.",
    expected:
      "A refusal with the reason consent_withdrawn; the earlier export now reads suspended.",
    minutes: 0.5,
  },
  {
    id: "w9-quota",
    workflow: "W9",
    title: "Campaign charter and credit quota",
    persona: "tenant_admin",
    route: "/demo/w9-campaign",
    tryIt: "Edit a threshold, then set the quota to the committed value and start the job probe.",
    expected:
      "Protocol version 2 is created and version 1 is unchanged; the job is refused with quota_exhausted.",
    minutes: 1.5,
  },
];

export const TOUR_STEPS: readonly TourStep[] = Object.freeze(
  steps.map((step) => Object.freeze(step)),
);

export const tourMinutes = (): number => TOUR_STEPS.reduce((sum, step) => sum + step.minutes, 0);
