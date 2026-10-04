// The evidence workflow as data: which nodes exist, where they sit and how they connect. It holds
// ids, numbers and enums only; every word shown to a reader lives in src/content/home/workflow.ts,
// keyed by these ids. Both the static SVG and the lazily loaded 3D scene are drawn from this one
// source, so the two views can never disagree about the workflow.

export type LaneId = "learning" | "confirmation" | "governance" | "execution" | "outcome";
export type NodeKind = "start" | "end" | "state" | "hold" | "success" | "failure";
/** How a transition reads at a glance: advances, loops back for remediation, fails, or feeds learning. */
export type EdgeTone = "pass" | "remediate" | "fail" | "learn";
/** Compass side of a node. N is the top of the diagram (smaller z), S the bottom. */
export type Side = "N" | "S" | "E" | "W";

/** A connection point on one side of a node; `offset` slides along that side in world units. */
export type Port = readonly [side: Side, offset: number];
/** Moves the route to an absolute world coordinate, changing only that axis. */
export type RouteStep = readonly [axis: "x" | "z", value: number];

/**
 * A right-angle route. It leaves `exit`, follows `via` in order, then reaches `enter`; a closing
 * corner is added automatically when the last step does not line up with the entry port.
 */
export interface RouteSpec {
  readonly exit: Port;
  readonly via: readonly RouteStep[];
  readonly enter: Port;
}

export interface WorkflowLane {
  readonly id: LaneId;
  /** Height of the lane in the 3D scene's separated view; the flat views ignore it. */
  readonly elevation: number;
}

export interface WorkflowNode {
  readonly id: string;
  readonly lane: LaneId;
  readonly kind: NodeKind;
  /** Ground-plane position in world units. Nodes share columns and rows so they line up. */
  readonly x: number;
  readonly z: number;
}

export interface WorkflowEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly tone: EdgeTone;
  readonly route: RouteSpec;
}

export interface WorkflowNote {
  readonly id: string;
  readonly attachTo: string;
  readonly x: number;
  readonly z: number;
}

export const WORKFLOW_LANES: readonly WorkflowLane[] = Object.freeze([
  { id: "learning", elevation: 7.2 },
  { id: "confirmation", elevation: 4.8 },
  { id: "governance", elevation: 2.4 },
  { id: "execution", elevation: 0 },
  { id: "outcome", elevation: 0 },
]);

// Grid columns (x) and rows (z) that nodes snap to.
const COL = {
  outcome: -22,
  learning: -16.5,
  execution: -9.5,
  hold: -2.5,
  start: 1.5,
  hits: 10,
  review: 15.5,
} as const;

const ROW = {
  acceptance: -15,
  top: -11,
  rights: -6,
  confirmed: -3.4,
  prioritise: -1.2,
  validation: 1,
  material: 4.2,
  gate: 6.5,
  elab: 8.4,
  outcome: 10.5,
  finish: 12.5,
  ingestion: 15.3,
} as const;

const node = (id: string, lane: LaneId, kind: NodeKind, x: number, z: number): WorkflowNode =>
  Object.freeze({ id, lane, kind, x, z });

export const WORKFLOW_NODES: readonly WorkflowNode[] = Object.freeze([
  node("start", "governance", "start", COL.start, ROW.top),
  node("rights", "governance", "state", COL.start, ROW.rights),
  node("hold", "governance", "hold", COL.hold, ROW.prioritise),
  node("silico", "governance", "state", COL.execution, ROW.prioritise),
  node("lead-gate", "governance", "state", COL.outcome, ROW.gate),

  node("material", "execution", "state", COL.execution, ROW.material),
  node("elab", "execution", "state", COL.execution, ROW.elab),
  node("wetlab", "execution", "state", COL.execution, ROW.finish),
  node("ingestion", "execution", "state", COL.outcome, ROW.ingestion),

  node("acceptance", "learning", "state", COL.learning, ROW.acceptance),
  node("agent-update", "learning", "state", COL.learning, ROW.top),
  node("retraining", "learning", "state", COL.learning, ROW.confirmed),
  node("validation", "learning", "state", COL.learning, ROW.validation),

  node("assay-confirm", "confirmation", "state", COL.review, ROW.top),
  node("confirmed-hit", "confirmation", "state", COL.hits, ROW.confirmed),
  node("bio-confirm", "confirmation", "state", COL.hits, ROW.prioritise),
  node("supported-hit", "confirmation", "state", COL.hits, ROW.material),
  node("investigation", "confirmation", "state", COL.review, ROW.material),

  node("qualified", "outcome", "success", COL.outcome, ROW.outcome),
  node("terminated", "outcome", "failure", COL.learning, ROW.outcome),
  node("end", "outcome", "end", COL.outcome, ROW.finish),
]);

const N = (offset = 0): Port => ["N", offset];
const S = (offset = 0): Port => ["S", offset];
const E = (offset = 0): Port => ["E", offset];
const W = (offset = 0): Port => ["W", offset];
const X = (value: number): RouteStep => ["x", value];
const Z = (value: number): RouteStep => ["z", value];

const route = (exit: Port, via: readonly RouteStep[], enter: Port): RouteSpec =>
  Object.freeze({ exit, via: Object.freeze([...via]), enter });

const edge = (
  id: string,
  from: string,
  to: string,
  tone: EdgeTone,
  path: RouteSpec,
): WorkflowEdge => Object.freeze({ id, from, to, tone, route: path });

const STRAIGHT_DOWN = route(S(), [], N());

export const WORKFLOW_EDGES: readonly WorkflowEdge[] = Object.freeze([
  edge("start-rights", "start", "rights", "pass", STRAIGHT_DOWN),
  edge("rights-hold", "rights", "hold", "remediate", route(S(-1.05), [Z(-4.2), X(-2.9)], N(-0.4))),
  edge("hold-rights", "hold", "rights", "remediate", route(N(0.4), [Z(-3.6), X(2)], S(0.5))),
  edge("rights-silico", "rights", "silico", "pass", route(E(), [X(4.5), Z(-3), X(-9)], N(0.5))),
  edge("silico-material", "silico", "material", "pass", STRAIGHT_DOWN),
  edge("material-elab", "material", "elab", "pass", STRAIGHT_DOWN),
  edge("material-hold", "material", "hold", "remediate", route(N(1), [Z(2.7), X(-1.9)], S(0.6))),
  edge("hold-material", "hold", "material", "pass", route(S(-0.6), [Z(1.4), X(-10.5)], N(-1))),
  edge("hold-lead-gate", "hold", "lead-gate", "pass", route(S(-0.2), [Z(2), X(-23.05)], N(-1.05))),
  edge("lead-gate-hold", "lead-gate", "hold", "remediate", route(N(), [Z(3.1), X(-2.3)], S(0.2))),
  edge(
    "supported-lead-gate",
    "supported-hit",
    "lead-gate",
    "pass",
    route(S(), [Z(5.1), X(-20.95)], N(1.05)),
  ),
  edge("lead-gate-qualified", "lead-gate", "qualified", "pass", STRAIGHT_DOWN),
  edge("qualified-end", "qualified", "end", "pass", STRAIGHT_DOWN),
  edge("terminated-end", "terminated", "end", "fail", route(S(), [Z(ROW.finish)], E())),
  edge(
    "investigation-terminated",
    "investigation",
    "terminated",
    "fail",
    route(S(-0.5), [Z(6.5), X(COL.learning)], N()),
  ),
  edge(
    "investigation-elab",
    "investigation",
    "elab",
    "remediate",
    route(S(0.8), [Z(7.1), X(-8.5)], N(1)),
  ),
  edge(
    "assay-confirmed-hit",
    "assay-confirm",
    "confirmed-hit",
    "pass",
    route(S(-1.05), [Z(-9), X(COL.hits)], N()),
  ),
  edge("assay-investigation", "assay-confirm", "investigation", "fail", STRAIGHT_DOWN),
  edge("confirmed-bio", "confirmed-hit", "bio-confirm", "pass", STRAIGHT_DOWN),
  edge("bio-supported", "bio-confirm", "supported-hit", "pass", STRAIGHT_DOWN),
  edge(
    "bio-investigation",
    "bio-confirm",
    "investigation",
    "fail",
    route(S(0.9), [Z(1), X(14.7)], N(-0.8)),
  ),
  edge("elab-wetlab", "elab", "wetlab", "pass", STRAIGHT_DOWN),
  edge("wetlab-ingestion", "wetlab", "ingestion", "pass", route(S(), [Z(13.8), X(-21)], N(1))),
  edge(
    "ingestion-acceptance",
    "ingestion",
    "acceptance",
    "learn",
    route(W(), [X(-25.2), Z(-12.6), X(-17.7)], S(-1.2)),
  ),
  edge("acceptance-update", "acceptance", "agent-update", "learn", STRAIGHT_DOWN),
  edge(
    "acceptance-assay",
    "acceptance",
    "assay-confirm",
    "pass",
    route(S(0.55), [Z(-13.3), X(COL.review)], N()),
  ),
  edge(
    "acceptance-investigation",
    "acceptance",
    "investigation",
    "fail",
    route(S(1.1), [Z(-13.9), X(24), Z(2.4), X(16.3)], N(0.8)),
  ),
  edge("update-retraining", "agent-update", "retraining", "learn", route(S(-0.6), [], N(-0.6))),
  edge("update-silico", "agent-update", "silico", "learn", route(S(1), [Z(-9.5), X(-10.5)], N(-1))),
  edge("retraining-validation", "retraining", "validation", "learn", route(S(-0.6), [], N(-0.6))),
  edge(
    "validation-update",
    "validation",
    "agent-update",
    "learn",
    route(N(1), [Z(-0.5), X(-13.5), Z(-9), X(-16.3)], S(0.2)),
  ),
]);

export const WORKFLOW_NOTES: readonly WorkflowNote[] = Object.freeze([
  Object.freeze({ id: "note-ground-truth", attachTo: "agent-update", x: -20.8, z: -7 }),
  Object.freeze({ id: "note-thresholds", attachTo: "assay-confirm", x: 19.5, z: -6.1 }),
]);

export const nodeById = (id: string): WorkflowNode | undefined =>
  WORKFLOW_NODES.find((entry) => entry.id === id);
