import { describe, expect, it } from "vitest";
import { TOUR_STEP_IDS } from "@/lib/demo/tour/step-ids";
import {
  TOUR_STORAGE_KEY,
  TOUR_VERSION,
  clampStep,
  goTo,
  isComplete,
  markDone,
  parseState,
  resetTour,
  serializeState,
  startTour,
} from "@/lib/demo/tour/state";

const NOW = new Date("2030-01-02T03:04:05.000Z");
const LATER = new Date("2030-01-02T04:00:00.000Z");
const TENANT = "tenant-abc";

describe("tour state (A-P5B-18)", () => {
  it("uses the documented storage key and version", () => {
    expect(TOUR_STORAGE_KEY).toBe("newma.tour.v1");
    expect(TOUR_VERSION).toBe(1);
  });

  it("starts at the first step with nothing done", () => {
    expect(startTour(TENANT, NOW)).toEqual({
      version: 1,
      tenant_id: TENANT,
      started_at: NOW.toISOString(),
      current: 0,
      done: [],
    });
  });

  it("moves between steps and clamps to the script", () => {
    const start = startTour(TENANT, NOW);
    expect(goTo(start, 5).current).toBe(5);
    expect(goTo(start, -3).current).toBe(0);
    expect(goTo(start, 99).current).toBe(TOUR_STEP_IDS.length - 1);
    expect(goTo(start, 2.7).current).toBe(2);
    expect(clampStep(Number.NaN)).toBe(0);
  });

  it("marks steps done once, in script order, without moving the current step", () => {
    const start = goTo(startTour(TENANT, NOW), 3);
    const one = markDone(start, "w1-acknowledge");
    const two = markDone(one, "w1-evaluate");
    expect(two.done).toEqual(["w1-evaluate", "w1-acknowledge"]);
    expect(markDone(two, "w1-evaluate")).toEqual(two);
    expect(two.current).toBe(3);
  });

  it("completes when every step is done", () => {
    const all = TOUR_STEP_IDS.reduce((state, id) => markDone(state, id), startTour(TENANT, NOW));
    expect(isComplete(all)).toBe(true);
    expect(isComplete(startTour(TENANT, NOW))).toBe(false);
  });

  it("resets to step one for the same tenant with a new start time", () => {
    const mid = markDone(goTo(startTour(TENANT, NOW), 8), "w1-evaluate");
    expect(resetTour(mid, LATER)).toEqual({
      version: 1,
      tenant_id: TENANT,
      started_at: LATER.toISOString(),
      current: 0,
      done: [],
    });
  });

  it("never mutates its inputs", () => {
    const start = startTour(TENANT, NOW);
    const snapshot = JSON.stringify(start);
    goTo(start, 4);
    markDone(start, "home");
    resetTour(start, LATER);
    expect(JSON.stringify(start)).toBe(snapshot);
    expect(Object.isFrozen(start)).toBe(true);
    expect(Object.isFrozen(start.done)).toBe(true);
  });

  it("round-trips through serialise and parse", () => {
    const state = markDone(goTo(startTour(TENANT, NOW), 6), "home");
    expect(parseState(serializeState(state), TENANT)).toEqual({ state });
  });

  describe("parseState", () => {
    const valid = () => ({
      version: 1,
      tenant_id: TENANT,
      started_at: NOW.toISOString(),
      current: 2,
      done: ["home"],
    });
    const parse = (value: unknown) => parseState(JSON.stringify(value), TENANT);

    it("reads nothing when no value is stored", () => {
      expect(parseState(null, TENANT)).toEqual({});
    });

    it("accepts a valid stored value", () => {
      expect(parse(valid()).state).toMatchObject({ current: 2, done: ["home"] });
    });

    it("discards malformed JSON", () => {
      expect(parseState("{not json", TENANT)).toEqual({ discarded: "malformed" });
      expect(parseState("null", TENANT)).toEqual({ discarded: "malformed" });
      expect(parseState('"x"', TENANT)).toEqual({ discarded: "malformed" });
      expect(parseState("[]", TENANT)).toEqual({ discarded: "malformed" });
    });

    it("discards another version", () => {
      expect(parse({ ...valid(), version: 2 })).toEqual({ discarded: "version" });
      expect(parse({ ...valid(), version: "1" })).toEqual({ discarded: "malformed" });
    });

    it("discards a value that belongs to another tenant", () => {
      expect(parse({ ...valid(), tenant_id: "tenant-other" })).toEqual({ discarded: "tenant" });
    });

    it.each([
      ["a non-integer current", { current: 1.5 }],
      ["a negative current", { current: -1 }],
      ["a current past the script", { current: TOUR_STEP_IDS.length }],
      ["a missing start time", { started_at: undefined }],
      ["an unparseable start time", { started_at: "yesterday" }],
      ["done that is not a list", { done: "home" }],
      ["an unknown done id", { done: ["nope"] }],
      ["a duplicated done id", { done: ["home", "home"] }],
      ["a non-string done id", { done: [1] }],
    ])("discards %s", (_name, patch) => {
      expect(parse({ ...valid(), ...patch })).toEqual({ discarded: "malformed" });
    });

    it("ignores unknown extra fields so no token can ride along", () => {
      const parsed = parse({ ...valid(), token: "secret", session_id: "sid" });
      expect(parsed.state).toBeDefined();
      expect(JSON.stringify(parsed.state)).not.toContain("secret");
      expect(Object.keys(parsed.state!).sort()).toEqual([
        "current",
        "done",
        "started_at",
        "tenant_id",
        "version",
      ]);
    });
  });
});
