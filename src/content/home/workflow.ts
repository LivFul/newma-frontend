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
  heading: block("home.workflow.heading", "Workflow", ["C-54"]),
  intro: block(
    "home.workflow.intro",
    "The evidence workflow is designed as a loop. Rights and material checks come before experiments, a scientist accepts or rejects what the lab returns, and a failed check sends the work to investigation or a hold instead of forward.",
    ["C-54"],
  ),
  caption: block(
    "home.workflow.caption",
    "Illustrative workflow. It shows design intent, not a deployed system.",
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
  explore: block("home.workflow.explore", "Explore in three dimensions", ["C-55"]),
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
  textSummary: block("home.workflow.text.summary", "Read the workflow as text", ["C-55"]),
  textLeadsTo: block("home.workflow.text.leads", "Leads to", ["C-55"]),
  textEnds: block("home.workflow.text.ends", "No further steps", ["C-55"]),
});

// Lane names group the steps and key the colours; the order is the reading order of the text version.
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
  fail: block("home.workflow.tone.fail", "Fails or evidence insufficient", EDGE),
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
