import { describe, expect, it } from "vitest";
import { TOUR_STEP_IDS } from "@/lib/demo/tour/step-ids";
import {
  TOUR_MAX_MINUTES,
  TOUR_MIN_MINUTES,
  TOUR_STEPS,
  isDemoStepRoute,
  tourMinutes,
} from "@/lib/demo/tour/steps";
import { isPersonaId } from "@/lib/personas";
import { WORKFLOWS } from "@/lib/demo/workflows";

const KNOWN_ROUTES = new Set<string>([
  "/",
  "/demo/tour",
  ...WORKFLOWS.flatMap((w) => (w.href ? [w.href] : [])),
]);
const routePath = (route: string) => route.split("?")[0] ?? route;

describe("TOUR_STEPS (A-P5B-19, sprint plan §9)", () => {
  it("has sixteen steps whose ids are unique and follow the id list in order", () => {
    expect(TOUR_STEPS).toHaveLength(16);
    expect(TOUR_STEPS.map((s) => s.id)).toEqual([...TOUR_STEP_IDS]);
    expect(new Set(TOUR_STEPS.map((s) => s.id)).size).toBe(TOUR_STEPS.length);
  });

  it("is deeply frozen", () => {
    expect(Object.isFrozen(TOUR_STEPS)).toBe(true);
    expect(TOUR_STEPS.every((s) => Object.isFrozen(s))).toBe(true);
  });

  it("uses a valid persona (or none for the homepage) and a known route on every step", () => {
    for (const step of TOUR_STEPS) {
      expect(step.persona === null || isPersonaId(step.persona), step.id).toBe(true);
      expect(KNOWN_ROUTES.has(routePath(step.route)), `${step.id}: ${step.route}`).toBe(true);
    }
  });

  it("has non-empty control, outcome and title text and a positive duration", () => {
    for (const step of TOUR_STEPS) {
      expect(step.title.trim(), step.id).not.toBe("");
      expect(step.tryIt.trim(), step.id).not.toBe("");
      expect(step.expected.trim(), step.id).not.toBe("");
      expect(step.minutes, step.id).toBeGreaterThan(0);
    }
  });

  it("totals between 12 and 15 minutes (14.25 planned)", () => {
    expect(tourMinutes()).toBe(14.25);
    expect(tourMinutes()).toBeGreaterThanOrEqual(TOUR_MIN_MINUTES);
    expect(tourMinutes()).toBeLessThanOrEqual(TOUR_MAX_MINUTES);
  });

  it("starts at the homepage link and orders personas as sprint plan §9 does", () => {
    expect(TOUR_STEPS[0]).toMatchObject({ route: "/", persona: null });
    expect(isDemoStepRoute(TOUR_STEPS[0]!.route)).toBe(false);
    expect(TOUR_STEPS.slice(1).every((s) => isDemoStepRoute(s.route))).toBe(true);
    expect(TOUR_STEPS.map((s) => s.workflow)).toEqual([
      "Home",
      "W1",
      "W10",
      "W1",
      "W2",
      "W3",
      "W4",
      "W5",
      "W5",
      "W5",
      "W6",
      "W8",
      "W7",
      "W1",
      "W8",
      "W9",
    ]);
    expect(TOUR_STEPS.slice(1, 3).map((s) => s.persona)).toEqual([
      "community_liaison",
      "community_liaison",
    ]);
  });

  it("sends the W7 step to the settlement route as Finance, and W9 comes last", () => {
    const w7 = TOUR_STEPS.find((s) => s.workflow === "W7");
    expect(w7).toMatchObject({ route: "/demo/w7-settlement", persona: "finance" });
    expect(TOUR_STEPS.at(-1)).toMatchObject({
      workflow: "W9",
      route: "/demo/w9-campaign",
      persona: "tenant_admin",
    });
  });

  it("keeps the labels the visitor is told to look for verbatim", () => {
    const text = TOUR_STEPS.map((s) => `${s.tryIt} ${s.expected}`).join("\n");
    for (const label of [
      "Simulated agent",
      "Mock ELN",
      "Simulated workflow engine",
      "Demo signature, not production key",
    ]) {
      expect(text).toContain(label);
    }
  });
});
