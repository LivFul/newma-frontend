// Sprint-review demo script, step 7 (docs/DEMO_SCRIPT.md): partner export (W8), then licensing and
// settlement (W7) with the disputed receipt, and science continuing through an anchoring outage.
import type { Locator, Page } from "@playwright/test";
import { banner, DEMO_BANNER_TEXT, switchPersona } from "./demo";
import { expect } from "./test";
import type { TourContext } from "./tour-context";
import { STEP_RUNS } from "./tour-driver";
import { VALID_CREDENTIAL, W7_ROUTE, bff, settlementAt } from "./w7";

const ANCHOR_TIMEOUT_MS = 60_000;
const JOB_TIMEOUT_MS = 120_000;
const LICENSE_URL = /\/demo\/w7-settlement\/licenses\/[^/]+$/;
const SETTLEMENT_URL = /\/demo\/w7-settlement\/settlements\/[^/?#]+$/;
const RECEIPT_AMOUNT = "600";
const outageToggle = (page: Page): Locator =>
  page.getByRole("switch", { name: "Simulate chain outage (demo)" });
const receiptRow = (page: Page, status: string): Locator =>
  page.locator(`[data-testid="receipt-row"][data-status="${status}"]`);

async function submitDialog(page: Page, trigger: string, fill: Record<string, string>, ok: string) {
  await page.getByRole("button", { name: trigger, exact: true }).click();
  const dialog = page.getByRole("dialog");
  for (const [label, value] of Object.entries(fill)) await dialog.getByLabel(label).fill(value);
  await dialog.getByRole("button", { name: ok }).click();
  await expect(dialog).toBeHidden();
}

/** Partner requests a license with a fictional credential; the tenant admin approves it. */
async function licenseApproved(page: Page): Promise<void> {
  await switchPersona(page, "partner");
  await page.goto(W7_ROUTE);
  await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
  await page.getByLabel("Credential (optional, simulated)").selectOption(VALID_CREDENTIAL);
  await page.getByLabel("Scope").fill("Illustrative research scope for the demo script");
  await page.getByRole("button", { name: "Request license" }).click();
  await page.waitForURL(LICENSE_URL);
  await page.getByRole("button", { name: "Run credential check" }).click();
  await expect(page.getByTestId("credential-result")).toContainText("Verified");
  await switchPersona(page, "tenant_admin");
  await submitDialog(
    page,
    "Decide license",
    { Rationale: "Scope fits the agreement" },
    "Record decision",
  );
  await expect(page.locator('#summary-heading [data-state="approved"]')).toBeVisible();
}

/** Finance records a receipt, reviews, approves the evidence and reconciles: a frozen calculation. */
async function receiptsReconciled(page: Page): Promise<void> {
  await switchPersona(page, "finance");
  await page.getByRole("button", { name: "Create settlement" }).click();
  await page.waitForURL(SETTLEMENT_URL);
  await page.getByLabel("Reference").fill("DEMO-SCRIPT-001");
  await page.getByLabel("Amount (demo credits)").fill(RECEIPT_AMOUNT);
  await page.getByRole("button", { name: "Record receipt" }).click();
  await expect(receiptRow(page, "recorded")).toHaveCount(1);
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await submitDialog(
    page,
    "Approve evidence",
    { Rationale: "Evidence is complete" },
    "Confirm evidence approval",
  );
  await page.getByRole("button", { name: "Reconcile receipts" }).click();
  await expect(page.getByTestId("calc-line")).toHaveCount(4);
  await expect(page.getByTestId("illustrative-badge").first()).toBeVisible();
  await expect(page.getByTestId("conservation")).toHaveText(
    `Conserved: ${RECEIPT_AMOUNT} demo credits`,
  );
  await expect(page.getByText("Frozen at reconciliation")).toBeVisible();
}

/** The seeded settlement: a disputed receipt is held, not payable, and nothing is posted. */
async function disputedReceiptHeld(page: Page): Promise<void> {
  const list = await bff(page, "GET", "/api/demo/settlements");
  const seeded = list.body.items.find((s: { display_id: string }) => s.display_id === "DEMO-S-001");
  expect(seeded, "the seeded settlement exists").toBeTruthy();
  await page.goto(`${W7_ROUTE}/settlements/${seeded.id}`);
  await expect(page.locator('#state-heading [data-state="disputed"]')).toBeVisible();
  await expect(receiptRow(page, "duplicate")).toContainText("rejected, not counted");
  await expect(receiptRow(page, "disputed")).toContainText("held — not payable");
  await expect(page.getByText("No payout: nothing has been posted")).toBeVisible();
}

async function screeningJobTerminal(page: Page): Promise<void> {
  await switchPersona(page, "scientist");
  await page.goto("/demo/jobs");
  await page.getByRole("button", { name: "Start simulated screening" }).click();
  await page.waitForURL(/\/demo\/jobs\/[^/]+$/);
  await expect
    .poll(() => page.getByTestId("job-state").getAttribute("data-state"), {
      timeout: JOB_TIMEOUT_MS,
    })
    .toMatch(/SUCCEEDED|FAILED|CANCELLED/);
}

/**
 * Anchoring outage: the commitment is signed at once while its anchor stays pending, a scientist's
 * job still finishes, and switching the outage off lets the anchor settle. The paid settlement is
 * prepared through the BFF; dual approval and distribution are covered by demo-w7-settlement.spec.ts.
 */
async function outageScienceContinues(page: Page): Promise<void> {
  const paid = await settlementAt(page, "paid"); // leaves the session as finance
  await page.goto(W7_ROUTE);
  await outageToggle(page).click();
  await expect(outageToggle(page)).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("outage-status")).toContainText(
    "Chain outage simulated — new anchors stay pending",
  );
  await page.goto(`${W7_ROUTE}/settlements/${paid.settlement.id}`);
  await submitDialog(page, "Final reconciliation and commitment", {}, "Run final reconciliation");
  await expect(page.getByTestId("commitment-card")).toContainText(
    "Demo signature, not production key",
  );
  await expect(page.getByTestId("anchor-status")).toContainText("Pending");
  await screeningJobTerminal(page);
  await switchPersona(page, "finance");
  await page.goto(W7_ROUTE);
  await outageToggle(page).click();
  await expect(outageToggle(page)).toHaveAttribute("aria-checked", "false");
  await page.goto(`${W7_ROUTE}/settlements/${paid.settlement.id}`);
  await expect(page.getByTestId("anchor-status")).toContainText("Anchored", {
    timeout: ANCHOR_TIMEOUT_MS,
  });
}

/** Step 7: partner export, license to reconciliation, the disputed receipt, the anchoring outage. */
export async function partnerAndFinance(page: Page, ctx: TourContext): Promise<void> {
  await switchPersona(page, "partner");
  await STEP_RUNS["w8-export"](page, ctx);
  await licenseApproved(page);
  await receiptsReconciled(page);
  await disputedReceiptHeld(page);
  await outageScienceContinues(page);
}
