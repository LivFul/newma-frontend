import { expect, test } from "../support/test";
import {
  banner,
  DEMO_BANNER_TEXT,
  expectNoAxeViolations,
  needsBackend,
  signIn,
  switchPersona,
} from "../support/demo";
import { W4_ROUTE as ROUTE, openCandidate, signGate } from "../support/w4";

// Signing includes a signed-event write and, under next dev, first-hit route compilation.
const SLOW_MS = 30_000;

test.describe("W4 gates", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w4 approver signs H1 with step-up and sees signed decision", async ({ page }) => {
    await signIn(page, "scientific_approver");
    const displayId = await openCandidate(page, 2);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    const { dialog, gateId } = await signGate(page, "H1", displayId, { doubleClick: true });
    await expect(dialog).toBeHidden({ timeout: SLOW_MS });
    const card = page.getByTestId("signed-decision");
    await expect(card).toHaveCount(1, { timeout: SLOW_MS });
    await expect(card).toContainText("Demo signature, not production key");
    await expect(page.locator('[data-stage="H1"]')).toHaveAttribute("data-status", "PASS");
    // Review Focus 2: a double click is one decision, never two.
    const timeline = await page.request.get(`/api/demo/provenance/gate/${gateId}`);
    const events = (await timeline.json()).events as Array<{ event_type: string }>;
    expect(events.filter((e) => e.event_type === "gate.decided")).toHaveLength(1);

    await openCandidate(page, 1);
    const diff = page.getByRole("region", { name: /Evidence diff v1 → v2/ });
    await expect(diff).toContainText("Changed");
    await expect(diff.locator("li").first()).toBeVisible();
  });

  test("w4 rank-1 held at H2 with missing replicate requirements", async ({ page, baseURL }) => {
    await signIn(page, "scientific_approver");
    const displayId = await openCandidate(page, 1);
    const { dialog, gateId } = await signGate(page, "H2", displayId);
    const alert = dialog.getByRole("alert");
    await expect(alert).toContainText("gate_requirements_missing");
    await expect(alert.getByRole("listitem")).toHaveCount(3);
    await dialog.getByRole("button", { name: "Close" }).click();

    await switchPersona(page, "scientist");
    await expect(
      page.locator('[data-stage="H2"]').getByRole("button", { name: "Sign H2 decision" }),
    ).toHaveAttribute("aria-disabled", "true");
    const forced = await page.request.post(`/api/demo/gates/${gateId}/decisions`, {
      headers: { origin: baseURL ?? "" },
      data: {
        decision: "pass",
        rationale: "forced",
        evidence_package_version: 2,
        confirm_candidate_display_id: displayId,
      },
    });
    expect(forced.status()).toBe(403);
    expect((await forced.json()).code).toBe("persona_forbidden");
  });

  test("w4 pages have zero axe violations (dialog closed and open)", async ({ page }) => {
    await signIn(page, "scientific_approver");
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
    await openCandidate(page, 2);
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
    await page
      .locator('[data-stage="H1"]')
      .getByRole("button", { name: "Sign H1 decision" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
