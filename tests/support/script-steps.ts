// Sprint-review demo script, steps 1 to 6 (docs/DEMO_SCRIPT.md). Each function performs what the
// script tells the presenter to do and asserts the key on-screen result. Where the tour driver
// already performs a control (tests/support/tour-driver.ts) this reuses it, so the script and the
// tour cannot drift apart.
import type { Page } from "@playwright/test";
import { EVIDENCE_LABEL_TEXT } from "../../src/lib/evidence";
import { SERVER_DEFAULT_CHOICE } from "../../src/lib/demo/parse-config";
import { PERSONA_LABELS, TOUR_ROUTE, banner, DEMO_BANNER_TEXT, switchPersona } from "./demo";
import { focusedHref, gotoHeroReady, heroSvg, tabToFirstComponent } from "./hero";
import { expect } from "./test";
import { SLOW_MS, type TourContext } from "./tour-context";
import { STEP_RUNS } from "./tour-driver";
import { rankOnePack } from "./tour-steps-partner";

const W1 = "/demo/w1-rights";
const W2 = "/demo/w2-evidence";
const W10 = "/demo/w10-custodian";
const WET_LAB_POSITION = 3; // Interface, Agentic Compute, Scientific Review, Wet Lab
const CONCERN = "The promised yearly report did not arrive this year.";
const TAKEN_BACK = "This agreement has been taken back.";

/** Demo speed for the automated walk (the presenter keeps the server default of 4x). */
export const SCRIPT_SPEED = "8";

/** Step 1: scroll, hover the hero, Tab and Enter into Wet Lab, follow "See it in the demo". */
export async function homepage(page: Page): Promise<void> {
  await gotoHeroReady(page);
  await page.mouse.move(400, 300);
  await page.mouse.wheel(0, 1500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await heroSvg(page).hover();
  await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
  await page.mouse.move(2, 2);
  await expect(heroSvg(page)).toHaveAttribute("data-view", "assembled");
  await tabToFirstComponent(page);
  for (let i = 0; i < WET_LAB_POSITION; i += 1) await page.keyboard.press("ArrowDown");
  expect(await focusedHref(page)).toBe("/ecosystem/wet-lab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/ecosystem\/wet-lab$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wet Lab");
  await page.getByRole("link", { name: "See it in the demo" }).click();
  await expect(page).toHaveURL(/\/access$/);
  await page.getByRole("button", { name: PERSONA_LABELS.community_liaison }).click();
  await page.waitForURL("**/demo");
  await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
}

/** Pre-flight for the automated walk only: a faster simulated-compute clock for this tenant. */
export async function useDemoSpeed(page: Page, speed: string): Promise<void> {
  await page.goto(TOUR_ROUTE);
  await page.getByLabel("Set demo speed").selectOption(speed);
  await expect(page.getByText(`Demo speed: ${speed}×`)).toBeVisible();
}

/** Puts the tenant back on the server default speed, as the presenter's pre-flight expects. */
export async function restoreServerSpeed(page: Page): Promise<void> {
  await page.goto(TOUR_ROUTE);
  await page.getByLabel("Set demo speed").selectOption(SERVER_DEFAULT_CHOICE);
  await expect(page.getByText("(server default)")).toBeVisible();
}

/** The subjects named under "Governing records" for the top-ranked partner pack. */
async function governingSubjects(page: Page): Promise<readonly string[]> {
  await switchPersona(page, "partner");
  await rankOnePack(page);
  const text = await page.getByText(/^Governing records:/).innerText();
  return text
    .replace(/^Governing records:\s*/, "")
    .split(",")
    .map((name) => name.trim());
}

/**
 * Picks a valid record that does not govern the top-ranked pack, so the withdrawal does not block
 * the W8 export in step 7 (the tour withdraws the governing record on purpose, in its step 15).
 */
async function withdrawableSubject(page: Page): Promise<string> {
  const governing = await governingSubjects(page);
  await switchPersona(page, "community_liaison");
  await page.goto(W1);
  const labels = await page
    .getByLabel("Asset")
    .locator("option", { hasText: "(valid)" })
    .allTextContents();
  const free = labels
    .map((label) => label.replace(/ \(valid\)$/, "").trim())
    .filter((name) => !governing.includes(name));
  expect(free.length, "a valid record outside the pack's governing records").toBeGreaterThan(0);
  return free.find((name) => /survey/i.test(name)) ?? free[0]!;
}

/** W10: raise a concern on an agreement that is still in force. */
async function raiseConcern(page: Page): Promise<void> {
  await page.goto(W10);
  const rows = page.getByTestId("obligation-row");
  await expect(rows.first()).toBeVisible();
  await expect(rows.filter({ hasNotText: /Done|Due|Late/ })).toHaveCount(0);
  const article = page.getByRole("article").filter({ hasNotText: TAKEN_BACK }).first();
  await article.locator("summary").click();
  await article.getByLabel("Tell us what happened").fill(CONCERN);
  await article.getByRole("button", { name: "Send concern" }).click();
  await page.waitForURL(/\?raised=/, { timeout: SLOW_MS });
  await expect(page.getByRole("status").filter({ hasText: "Your concern was sent" })).toBeVisible();
}

/** Step 2: valid consent, expired consent held, a withdrawal, then a W10 concern. */
export async function liaison(page: Page, ctx: TourContext): Promise<void> {
  await page.goto(W1);
  await STEP_RUNS["w1-evaluate"](page, ctx);
  ctx.governingSubject = await withdrawableSubject(page);
  await STEP_RUNS["w1-withdraw"](page, ctx);
  await raiseConcern(page);
}

/** Step 3: the six evidence labels (W2), then the agent query, its retry and the budget hold (W3). */
export async function scientist(page: Page, ctx: TourContext): Promise<void> {
  await switchPersona(page, "scientist");
  await page.goto(W2);
  const legend = page.getByRole("list", { name: "Evidence label legend" });
  for (const text of Object.values(EVIDENCE_LABEL_TEXT)) await expect(legend).toContainText(text);
  await page.goto(`${W2}?tab=observations`);
  await expect(
    page.getByRole("table", { name: "Observations" }).getByTestId("evidence-label").first(),
  ).toBeVisible();
  await STEP_RUNS["w3-agent"](page, ctx);
}

/** Step 4: H0 to H1 signed with step-up, then the H2 hold with its missing requirements. */
export async function approver(page: Page, ctx: TourContext): Promise<void> {
  await switchPersona(page, "scientific_approver");
  await STEP_RUNS["w4-gates"](page, ctx);
}

/** Step 6: verify a signature, then flip the tamper toggle to show it fail. */
export async function provenance(page: Page, ctx: TourContext): Promise<void> {
  await switchPersona(page, "scientific_approver");
  await STEP_RUNS["w6-verify"](page, ctx);
}
