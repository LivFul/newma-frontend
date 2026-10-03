// Drives every guided-tour step with the real UI (D-20, A-P5B-22): the dock chooses the persona and
// the page, the step function performs the control the step names and asserts its expected outcome.
import type { Locator, Page } from "@playwright/test";
import { PERSONA_LABELS, currentPersona } from "./demo";
import { expect } from "./test";
import type { StepRun, TourContext } from "./tour-context";
import {
  home,
  w10Concern,
  w1Acknowledge,
  w1Evaluate,
  w1Withdraw,
  w2Curation,
} from "./tour-steps-rights";
import { w3Agent, w4Gates, w5Accept, w5Import, w5Package, w6Verify } from "./tour-steps-science";
import { w7Settlement, w8Export, w8Refusal, w9Quota } from "./tour-steps-partner";
import { TOUR_STEPS, isDemoStepRoute } from "../../src/lib/demo/tour/steps";
import type { TourStepId } from "../../src/lib/demo/tour/step-ids";

export const STEP_RUNS: Readonly<Record<TourStepId, StepRun>> = {
  home,
  "w1-evaluate": w1Evaluate,
  "w10-concern": w10Concern,
  "w1-acknowledge": w1Acknowledge,
  "w2-curation": w2Curation,
  "w3-agent": w3Agent,
  "w4-gates": w4Gates,
  "w5-package": w5Package,
  "w5-import": w5Import,
  "w5-accept": w5Accept,
  "w6-verify": w6Verify,
  "w8-export": w8Export,
  "w7-settlement": w7Settlement,
  "w1-withdraw": w1Withdraw,
  "w8-refusal": w8Refusal,
  "w9-quota": w9Quota,
};

export const dock = (page: Page): Locator =>
  page.getByRole("complementary", { name: "Guided tour" });

/** Opens the dock panel if it is collapsed. */
export async function expandDock(page: Page): Promise<Locator> {
  const region = dock(page);
  // The panel loads lazily: wait for its toggle before deciding whether it is collapsed.
  const toggle = region.getByRole("button", { name: /^(Expand|Collapse)$/ });
  await expect(toggle).toBeVisible();
  if ((await toggle.textContent()) === "Expand") await toggle.click();
  await expect(region.getByRole("button", { name: "Collapse" })).toBeVisible();
  return region;
}

/** Asserts the dock is at step `n`, switches persona and opens the page, as a visitor would. */
export async function arriveAtStep(page: Page, index: number): Promise<void> {
  const step = TOUR_STEPS[index]!;
  const region = await expandDock(page);
  await expect(region).toContainText(`step ${index + 1} of ${TOUR_STEPS.length}`);
  await expect(region.getByTestId("tour-expected")).toHaveText(step.expected);
  if (step.persona) {
    const label = PERSONA_LABELS[step.persona];
    const switchButton = region.getByRole("button", { name: `Switch to ${label}` });
    if (await switchButton.isVisible()) await switchButton.click();
    await expect(currentPersona(page)).toHaveText(label);
    await expect(region.getByRole("button", { name: /^Switch to/ })).toHaveCount(0);
  }
  const open = region.getByRole("link", {
    name: step.workflow === "Home" ? "Open homepage" : `Open ${step.workflow}`,
  });
  if (isDemoStepRoute(step.route)) {
    await open.click();
    const url = new URL(step.route, "http://placeholder");
    await expect(page).toHaveURL(new RegExp(`${url.pathname.replace(/\//g, "\\/")}`));
  } else {
    // A step outside /demo is a plain link: a real navigation that returns 200.
    await expect(open).toHaveAttribute("href", step.route);
    await open.click();
    await expect(page).toHaveURL(new RegExp(`${step.route === "/" ? "/$" : step.route}`));
  }
  const reached = await page.request.get(step.route);
  expect(reached.status(), `${step.id}: ${step.route} must not be a dead end`).toBe(200);
}

/** Marks the step done and moves on; the dock must show the next step number. */
export async function completeStep(page: Page, index: number): Promise<void> {
  const region = await expandDock(page);
  const mark = region.getByRole("button", { name: "Mark step done" });
  if ((await mark.getAttribute("aria-pressed")) !== "true") await mark.click();
  await expect(mark).toHaveAttribute("aria-pressed", "true");
  await expect(region.getByText("Step done", { exact: true })).toBeVisible();
  if (index < TOUR_STEPS.length - 1) {
    await region.getByRole("button", { name: "Next" }).click();
    await expect(region).toContainText(`step ${index + 2} of ${TOUR_STEPS.length}`);
  }
}

export async function runStep(page: Page, index: number, ctx: TourContext): Promise<void> {
  await arriveAtStep(page, index);
  await STEP_RUNS[TOUR_STEPS[index]!.id](page, ctx);
}
