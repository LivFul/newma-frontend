import type { CopyBlock } from "../types";

// Homepage Workflow section copy. Claims: C-53 (step, transition, note and lane names), C-54
// (introduction, caption and the diagram's accessible name) and C-55 (interface labels). The step
// names come from the workflow diagram the user supplied on 2026-10-04 (assumption A-W-01), set in
// sentence case because the claims check allows capitals only at the start of a sentence. Wording is
// design intent, in step with the rest of the homepage (assumption A-P4-19).
const block = (id: string, text: string, claims: readonly string[]): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([...claims]) });

const NODE = ["C-53"] as const;
const EDGE = ["C-53"] as const;

export const WORKFLOW_SECTION = Object.freeze({
  heading: block("home.workflow.heading", "From research question to reviewed evidence", ["C-54"]),
  intro: block(
    "home.workflow.intro",
    "The proposed discovery workflow connects authorization, computational prioritization, material confirmation and laboratory testing. Each stage has a defined review point. Unresolved rights, uncertain material identity or insufficient evidence place work on hold or return it for investigation.",
    ["C-54"],
  ),
  supporting: block(
    "home.workflow.supporting",
    "A computational prediction is a hypothesis. Confirmed activity requires controlled experimental evidence. Early-lead qualification requires further biological, developability, supply and rights review.",
    ["C-54"],
  ),
  caption: block(
    "home.workflow.caption",
    "Proposed discovery workflow. Scientific advancement requires the relevant evidence and approvals.",
    ["C-54"],
  ),
  svgTitle: block("home.workflow.svg.title", "Evidence workflow diagram", ["C-54"]),
  svgDesc: block(
    "home.workflow.svg.desc",
    "A flow diagram of the evidence workflow, from authorization through laboratory results to scientist-approved decisions. A text version follows the diagram.",
    ["C-54"],
  ),
});

export const WORKFLOW_CONTROLS = Object.freeze({
  region: block("home.workflow.region", "Workflow diagram, scrolls sideways", ["C-55"]),
  explore: block("home.workflow.explore", "Explore workflow in three dimensions", ["C-55"]),
  close: block("home.workflow.close", "Back to diagram", ["C-55"]),
  loading: block("home.workflow.loading", "Loading the three-dimensional view", ["C-55"]),
  ready: block(
    "home.workflow.ready",
    "Three-dimensional view ready. Use the pan, tilt and zoom buttons to explore.",
    ["C-55"],
  ),
  failed: block(
    "home.workflow.failed",
    "The three-dimensional view could not start. The diagram below still works.",
    ["C-55"],
  ),
  unavailable: block("home.workflow.unavailable", "Three-dimensional view unavailable", ["C-55"]),
  separate: block("home.workflow.separate", "Separate lanes", ["C-55"]),
  legend: block("home.workflow.legend", "Transition kinds", ["C-55"]),
  navLabel: block("home.workflow.nav", "View navigation", ["C-55"]),
  panGroup: block("home.workflow.nav.pan", "Pan", ["C-55"]),
  tiltGroup: block("home.workflow.nav.tilt", "Tilt", ["C-55"]),
  zoomGroup: block("home.workflow.nav.zoom", "Zoom", ["C-55"]),
  panUp: block("home.workflow.nav.pan.up", "Pan up", ["C-55"]),
  panDown: block("home.workflow.nav.pan.down", "Pan down", ["C-55"]),
  panLeft: block("home.workflow.nav.pan.left", "Pan left", ["C-55"]),
  panRight: block("home.workflow.nav.pan.right", "Pan right", ["C-55"]),
  tiltUp: block("home.workflow.nav.tilt.up", "Tilt towards top-down", ["C-55"]),
  tiltDown: block("home.workflow.nav.tilt.down", "Tilt towards side view", ["C-55"]),
  zoomIn: block("home.workflow.nav.zoom.in", "Zoom in", ["C-55"]),
  zoomOut: block("home.workflow.nav.zoom.out", "Zoom out", ["C-55"]),
  reset: block("home.workflow.nav.reset", "Reset view", ["C-55"]),
  textSummary: block("home.workflow.text.summary", "View workflow steps", ["C-55"]),
  textStepPrefix: block("home.workflow.text.step", "Step", ["C-55"]),
  textLeadsTo: block("home.workflow.text.leads", "Leads to", ["C-55"]),
  textEnds: block("home.workflow.text.ends", "No further steps", ["C-55"]),
});

// Lane names group the steps and key the colours. The text version sets the reading order.
export const WORKFLOW_LANE_NAMES: Readonly<Record<string, CopyBlock>> = Object.freeze({
  governance: block("home.workflow.lane.governance", "Rights, governance and prioritization", NODE),
  execution: block("home.workflow.lane.execution", "Material, eLab and wet lab", NODE),
  learning: block("home.workflow.lane.learning", "Evidence and learning loop", NODE),
  confirmation: block("home.workflow.lane.confirmation", "Assay confirmation and triage", NODE),
  outcome: block("home.workflow.lane.outcome", "Outcomes", NODE),
});

export const WORKFLOW_TONE_NAMES: Readonly<Record<string, CopyBlock>> = Object.freeze({
  pass: block("home.workflow.tone.pass", "Advances", EDGE),
  remediate: block("home.workflow.tone.remediate", "Remediation or loop-back", EDGE),
  fail: block("home.workflow.tone.fail", "Fails", EDGE),
  learn: block("home.workflow.tone.learn", "Learning loop", EDGE),
});

const nodeLabel = (id: string, text: string): readonly [string, CopyBlock] => [
  id,
  block(`home.workflow.node.${id}`, text, NODE),
];

export const WORKFLOW_NODE_LABELS: Readonly<Record<string, CopyBlock>> = Object.freeze(
  Object.fromEntries([
    nodeLabel("start", "Start"),
    nodeLabel("rights", "Rights and use authorization"),
    nodeLabel("hold", "Scientific hold"),
    nodeLabel("silico", "In silico prioritization"),
    nodeLabel("lead-gate", "Early-lead qualification gate"),
    nodeLabel("material", "Mandatory material confirmation"),
    nodeLabel("elab", "eLabFTW assay request"),
    nodeLabel("wetlab", "Wet lab validation"),
    nodeLabel("ingestion", "Results ingestion"),
    nodeLabel("acceptance", "Scientist evidence acceptance"),
    nodeLabel("agent-update", "Reviewed agent / workflow update"),
    nodeLabel("retraining", "Separate retraining authorization"),
    nodeLabel("validation", "Predictive validation and release review"),
    nodeLabel("assay-confirm", "Mandatory assay confirmation"),
    nodeLabel("confirmed-hit", "Confirmed hit in specified assay"),
    nodeLabel("bio-confirm", "Mandatory biological confirmation"),
    nodeLabel("supported-hit", "Biologically supported hit"),
    nodeLabel("investigation", "Investigation"),
    nodeLabel("qualified", "Scientist-approved qualified early lead"),
    nodeLabel("terminated", "Candidate terminated"),
    nodeLabel("end", "End"),
  ]),
);

const edgeLabel = (id: string, text: string): readonly [string, CopyBlock] => [
  id,
  block(`home.workflow.edge.${id}`, text, EDGE),
];

// Transitions without an entry here are plain hand-offs and carry no label.
export const WORKFLOW_EDGE_LABELS: Readonly<Record<string, CopyBlock>> = Object.freeze(
  Object.fromEntries([
    edgeLabel("rights-hold", "Rights missing or unresolved"),
    edgeLabel("hold-rights", "Rights remediation required"),
    edgeLabel("rights-silico", "Authorized knowledge and material use"),
    edgeLabel("silico-material", "Reproducible hypothesis package"),
    edgeLabel("material-elab", "Identity, purity, batch, supply and rights confirmed"),
    edgeLabel("material-hold", "Mandatory material condition unmet"),
    edgeLabel("hold-material", "Material remediation completed"),
    edgeLabel("hold-lead-gate", "Lead evidence completed"),
    edgeLabel("lead-gate-hold", "Early-lead evidence incomplete"),
    edgeLabel(
      "lead-gate-qualified",
      "SAR, exposure, developability, supply and rights assessment pass",
    ),
    edgeLabel("investigation-terminated", "Scientist approves termination"),
    edgeLabel("investigation-elab", "Scientist approves redesigned experiment"),
    edgeLabel("assay-confirmed-hit", "Controls and replicated concentration response pass"),
    edgeLabel("assay-investigation", "Activity or assay quality insufficient"),
    edgeLabel(
      "bio-supported",
      "Orthogonal evidence, interference, cellular relevance and selectivity pass",
    ),
    edgeLabel("bio-investigation", "Mandatory biological evidence insufficient"),
    edgeLabel("elab-wetlab", "Approved protocol, endpoints and controls"),
    edgeLabel("wetlab-ingestion", "Raw data, replicates, uncertainty and failures"),
    edgeLabel("ingestion-acceptance", "Reconcile samples and preserve prior evidence"),
    edgeLabel("acceptance-update", "Accepted positive or negative observations"),
    edgeLabel("acceptance-assay", "Scientist accepts qualified observations"),
    edgeLabel("acceptance-investigation", "Missing, inconsistent or rejected records"),
    edgeLabel("update-retraining", "Separate model retraining proposal"),
    edgeLabel("update-silico", "Update retrieval, procedural memory and approved workflows"),
    edgeLabel("retraining-validation", "Explicit authorization and curated labels"),
    edgeLabel("validation-update", "Validation and release approval"),
  ]),
);

export const WORKFLOW_NOTE_TEXT: Readonly<Record<string, CopyBlock>> = Object.freeze({
  "note-ground-truth": block(
    "home.workflow.note.ground-truth",
    "Predictions never become experimental ground truth. Model-weight training is separately authorized.",
    NODE,
  ),
  "note-thresholds": block(
    "home.workflow.note.thresholds",
    "Campaign-specific thresholds are set before selection. Computational consensus cannot replace biological evidence.",
    NODE,
  ),
});

export type ScientificStep = Readonly<{ title: CopyBlock; text: CopyBlock }>;

const scientificStep = (id: string, title: string, text: string): ScientificStep =>
  Object.freeze({
    title: Object.freeze({ id: `${id}.title`, text: title, claims: Object.freeze(["C-54"]) }),
    text: Object.freeze({ id: `${id}.text`, text, claims: Object.freeze(["C-54"]) }),
  });

export const WORKFLOW_SCIENTIFIC_STEPS: readonly ScientificStep[] = Object.freeze([
  scientificStep(
    "home.workflow.step.authorize",
    "Authorize use.",
    "Confirm the authority, permissions and restrictions for the knowledge and materials involved. Resolve missing rights before proceeding.",
  ),
  scientificStep(
    "home.workflow.step.prioritize",
    "Prioritize hypotheses.",
    "Prepare chemical and biological inputs, run approved computational analyses and retain the rationale, uncertainty and reproducibility records.",
  ),
  scientificStep(
    "home.workflow.step.materials",
    "Confirm materials.",
    "Check material identity, purity, batch information, availability and permitted use before laboratory work.",
  ),
  scientificStep(
    "home.workflow.step.approve",
    "Approve experiments.",
    "A scientist reviews the assay plan, endpoints, controls and required deliverables before testing begins.",
  ),
  scientificStep(
    "home.workflow.step.review",
    "Review results.",
    "Reconcile samples and examine raw data, replicates, uncertainty, deviations and failures. A scientist accepts or rejects the observations.",
  ),
  scientificStep(
    "home.workflow.step.activity",
    "Confirm activity.",
    "Apply predefined assay criteria and relevant independent biological checks. Insufficient or conflicting evidence prompts investigation, redesigned experiments or termination.",
  ),
  scientificStep(
    "home.workflow.step.earlylead",
    "Assess early-lead readiness.",
    "Review the required activity, selectivity, structure\u2013activity relationships, exposure, developability, supply and rights evidence before approving a qualified early lead.",
  ),
  scientificStep(
    "home.workflow.step.cycle",
    "Inform the next cycle.",
    "Use accepted positive and negative observations to inform subsequent prioritization. Changes to predictive model training require separate authorization and validation.",
  ),
]);

export const WORKFLOW_SOFTWARE = Object.freeze({
  heading: block("home.workflow.software.heading", "Software request flow", ["C-54"]),
  intro: block(
    "home.workflow.software.intro",
    "Within the discovery process, the proposed software workflow manages an individual request and its records:",
    ["C-54"],
  ),
  chain: block(
    "home.workflow.software.chain",
    "Request \u2192 Rights check \u2192 Ranked hypotheses \u2192 Screening \u2192 Scientist review \u2192 Wet lab \u2192 Acceptance \u2192 Provenance",
    ["C-54"],
  ),
  body: block(
    "home.workflow.software.body",
    "A request begins with a question, objective and constraints. Access and rights checks govern retrieval. Computational work produces hypotheses for scientific review; approved assays return results for acceptance or rejection. Decisions and associated records are designed to carry signed, versioned provenance.",
    ["C-54"],
  ),
  disclaimer: block(
    "home.workflow.software.disclaimer",
    "These execution steps support the scientific workflow. Completing a software request does not, by itself, confirm biological activity or qualify an early lead.",
    ["C-54"],
  ),
  reproducibility: block(
    "home.workflow.software.reproducibility",
    "Recording inputs, versions and settings is intended to support reproducibility and review.",
    ["C-54"],
  ),
});

export const WORKFLOW_LEGEND_ITEMS: readonly Readonly<{ label: CopyBlock; text: CopyBlock }>[] =
  Object.freeze([
    Object.freeze({
      label: block("home.workflow.legend.advances", "Advances", ["C-53"]),
      text: block(
        "home.workflow.legend.advances.text",
        "The relevant requirements are met and work proceeds.",
        ["C-53"],
      ),
    }),
    Object.freeze({
      label: block("home.workflow.legend.remediation", "Remediation / loop-back", ["C-53"]),
      text: block(
        "home.workflow.legend.remediation.text",
        "Work is held or returned for correction and further review.",
        ["C-53"],
      ),
    }),
    Object.freeze({
      label: block("home.workflow.legend.fails", "Fails", ["C-53"]),
      text: block("home.workflow.legend.fails.text", "Work ends and the reason is recorded.", [
        "C-53",
      ]),
    }),
    Object.freeze({
      label: block("home.workflow.legend.learning", "Learning loop", ["C-53"]),
      text: block(
        "home.workflow.legend.learning.text",
        "Accepted observations return to the knowledge layer and inform later prioritization.",
        ["C-53"],
      ),
    }),
  ]);
