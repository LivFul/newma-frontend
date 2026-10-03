import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import {
  banner,
  DEMO_BANNER_TEXT,
  expectNoAxeViolations,
  needsBackend,
  signIn,
} from "../support/demo";
import { openCandidate, signGate } from "../support/w4";

/** Setup through W4: the approver signs H1 for rank 2, then follows the card to its timeline. */
async function signedGateTimeline(page: Page): Promise<void> {
  await signIn(page, "scientific_approver");
  const displayId = await openCandidate(page, 2);
  await signGate(page, "H1", displayId);
  await page.getByRole("link", { name: "View signed provenance for this gate" }).click();
  await page.waitForURL(/\/demo\/w6-provenance\/gate\//);
}

const hashes = (page: Page) => page.getByTestId("hash-comparison");
const verifyResult = (page: Page) => page.getByTestId("verify-result");

test.describe("W6 provenance", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w6 timeline and valid signature", async ({ page }) => {
    await signedGateTimeline(page);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    await expect(page.locator('[data-event-type="gate.decided"]')).toHaveCount(1);
    await expect(hashes(page)).toHaveText("Hashes match");
    await expect(page.getByTestId("canonical-comparison")).toContainText(
      "matches the server byte-for-byte",
    );
    await page.getByRole("button", { name: "Verify signature" }).click();
    await expect(verifyResult(page)).toHaveText("Valid");
  });

  test("w6 tampered manifest fails verification visibly", async ({ page }) => {
    await signedGateTimeline(page);
    const toggle = page.getByRole("switch", { name: "Demo tamper toggle" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText(/Altered field:/)).toBeVisible();
    await expect(hashes(page)).toHaveText("Hashes differ");
    await page.getByRole("button", { name: "Verify signature" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Invalid" })).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(verifyResult(page)).toHaveText("Valid");
    await expect(hashes(page)).toHaveText("Hashes match");
  });

  test("w6 pages have zero axe violations", async ({ page }) => {
    await signedGateTimeline(page);
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
    await page.goto("/demo/w6-provenance");
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
  });
});
