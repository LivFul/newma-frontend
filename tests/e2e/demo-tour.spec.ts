import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import {
  PERSONA_LABELS,
  TOUR_ROUTE,
  banner,
  currentPersona,
  DEMO_BANNER_TEXT,
  expectNoAxeViolations,
  needsBackend,
  signIn,
  signOut,
  switchPersona,
} from "../support/demo";
import type { TourContext } from "../support/tour-context";
import { arriveAtStep, completeStep, dock, expandDock, runStep } from "../support/tour-driver";
import { TOUR_STEPS } from "../../src/lib/demo/tour/steps";

const TOTAL = TOUR_STEPS.length;
// Demo speed for the driver run (A-P5B-22); the timed manual run uses the server default.
const DRIVER_SPEED = "8";
const WALK_TIMEOUT_MS = 20 * 60_000;

/** Sets the tenant speed override through the speed control and starts the tour. */
async function startTourAtSpeed(page: Page, speed = DRIVER_SPEED): Promise<void> {
  await page.goto(TOUR_ROUTE);
  await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
  await expect(page.getByText(/^Demo speed: \d+×/)).toBeVisible();
  await page.getByLabel("Set demo speed").selectOption(speed);
  await expect(page.getByText(`Demo speed: ${speed}×`)).toBeVisible();
  await expect(page.getByText("(your override)")).toBeVisible();
  await page.getByRole("button", { name: "Start tour" }).click();
  await expect(dock(page)).toContainText(`step 1 of ${TOTAL}`);
}

test.describe("Guided tour", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("tour walks every step with the real UI at demo speed 8", async ({ page }) => {
    test.setTimeout(WALK_TIMEOUT_MS);
    await signIn(page, "scientist");
    await startTourAtSpeed(page);
    const ctx: TourContext = {};
    for (let index = 0; index < TOTAL; index += 1) {
      await runStep(page, index, ctx);
      await completeStep(page, index);
    }
    const region = await expandDock(page);
    await expect(region.getByRole("status")).toContainText("Tour complete");
    await region.getByRole("button", { name: "End tour" }).click();
    await expect(dock(page)).toHaveCount(0);
  });

  test("every step opens its page with the right persona and no dead end", async ({ page }) => {
    await signIn(page, "scientist");
    await startTourAtSpeed(page, "4");
    for (let index = 0; index < TOTAL; index += 1) {
      await arriveAtStep(page, index);
      const step = TOUR_STEPS[index]!;
      if (step.persona) await expect(currentPersona(page)).toHaveText(PERSONA_LABELS[step.persona]);
      if (index === 0) await page.goto("/demo");
      await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
      if (index < TOTAL - 1) {
        const region = await expandDock(page);
        await region.getByRole("button", { name: "Next" }).click();
      }
    }
  });

  test("tour survives a reload and a persona switch, and Reset demo returns to step 1", async ({
    page,
  }) => {
    await signIn(page, "scientist");
    await startTourAtSpeed(page, "4");
    const region = await expandDock(page);
    for (let n = 2; n <= 4; n += 1) {
      await region.getByRole("button", { name: "Next" }).click();
      await expect(region).toContainText(`step ${n} of ${TOTAL}`);
    }
    await page.reload();
    await expect(dock(page)).toContainText(`step 4 of ${TOTAL}`);
    await switchPersona(page, "finance");
    await expect(dock(page)).toContainText(`step 4 of ${TOTAL}`);

    const after = await expandDock(page);
    await after.getByRole("button", { name: "Mark step done" }).click();
    await after.getByRole("button", { name: "Reset demo data", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(dock(page)).toContainText(`step 1 of ${TOTAL}`);
    await expect(dock(page).getByText("Done")).toHaveCount(0);
    // The speed override survives a reset (A-P5B-17).
    await page.goto(TOUR_ROUTE);
    await expect(page.getByText("(your override)")).toBeVisible();
  });

  test("tour reset mid-tour restarts cleanly and the first steps reproduce their outcomes", async ({
    page,
  }) => {
    test.setTimeout(WALK_TIMEOUT_MS);
    await signIn(page, "scientist");
    await startTourAtSpeed(page, "8");
    const ctx: TourContext = {};
    for (const index of [1, 2]) {
      await runStep(page, index, ctx);
      await completeStep(page, index);
    }
    await runStep(page, 3, ctx);
    const region = await expandDock(page);
    await region.getByRole("button", { name: "Reset demo data", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(dock(page)).toContainText(`step 1 of ${TOTAL}`);
    // The concern is gone with the reset; the same steps work again.
    await switchPersona(page, "data_steward");
    expect(
      ((await (await page.request.get("/api/demo/grievances")).json()) as { items: unknown[] })
        .items,
    ).toHaveLength(0);
    for (const index of [1, 2, 3]) await runStep(page, index, ctx);
  });

  test("tour progress from another demo session is discarded", async ({ page }) => {
    await signIn(page, "scientist");
    await startTourAtSpeed(page, "4");
    await signOut(page);
    await signIn(page, "community_liaison");
    await expect(page.getByRole("status")).toContainText(/different demo session/i);
    await expect(dock(page).getByText("Guided tour, step")).toHaveCount(0);
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(page.getByRole("status")).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem("newma.tour.v1"))).toBeNull();
  });

  test("tour dock adds no script when no tour is active and stores no token", async ({
    page,
    context,
  }) => {
    await signIn(page, "scientist");
    const scripts = async (path: string): Promise<string[]> => {
      const fresh = await context.newPage();
      const urls: string[] = [];
      fresh.on("response", (r) => {
        if (r.request().resourceType() === "script") urls.push(r.url());
      });
      await fresh.goto(path);
      await fresh.waitForLoadState("networkidle");
      await fresh.close();
      return urls;
    };
    const idle = await scripts("/demo/w1-rights");
    await startTourAtSpeed(page, "4");
    const active = await scripts("/demo/w1-rights");
    expect(active.length).toBeGreaterThan(idle.length);
    const stored = await page.evaluate(() => sessionStorage.getItem("newma.tour.v1"));
    expect(JSON.parse(stored ?? "{}")).toEqual({
      version: 1,
      tenant_id: expect.any(String),
      started_at: expect.any(String),
      current: 0,
      done: [],
    });
  });

  test("tour panel works by keyboard alone", async ({ page }) => {
    await signIn(page, "scientist");
    await startTourAtSpeed(page, "4");
    const region = dock(page);
    await region.getByRole("button", { name: "Next" }).focus();
    await page.keyboard.press("Enter");
    await expect(region).toContainText(`step 2 of ${TOTAL}`);
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");
    await expect(region).toContainText(`step 1 of ${TOTAL}`);
    await region.getByRole("button", { name: "Expand" }).focus();
    await page.keyboard.press("Space");
    await expect(region.getByRole("button", { name: "Collapse" })).toBeVisible();
    const stepButton = region.getByRole("button", { name: /^3\. / });
    await stepButton.focus();
    await page.keyboard.press("Enter");
    await expect(region).toContainText(`step 3 of ${TOTAL}`);
    await expect(region.getByRole("link", { name: /^Open W10/ })).toBeVisible();
  });

  test("tour pages have zero axe violations and the banner", async ({ page }) => {
    await signIn(page, "scientist");
    await page.goto(TOUR_ROUTE);
    await page.waitForLoadState("networkidle");
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Start tour" }).click();
    await expandDock(page);
    await expectNoAxeViolations(page);
    await dock(page).getByRole("button", { name: "Reset demo data", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
