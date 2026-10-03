import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import {
  banner,
  DEMO_BANNER_TEXT,
  expectNoAxeViolations,
  needsBackend,
  signIn,
  switchPersona,
} from "../support/demo";
import { VALID_CREDENTIAL, W7_ROUTE, as, bff, settlementAt } from "../support/w7";

const ANCHOR_TIMEOUT_MS = 60_000;
const TERMINAL_TIMEOUT_MS = 120_000;
const LICENSE_URL = /\/demo\/w7-settlement\/licenses\/[^/]+$/;
const SETTLEMENT_URL = /\/demo\/w7-settlement\/settlements\/[^/?#]+$/;
const idFromUrl = (page: Page) => new URL(page.url()).pathname.split("/").at(-1) ?? "";

const row = (page: Page, status: string) =>
  page.locator(`[data-testid="receipt-row"][data-status="${status}"]`);

/** Fills a dialog form, submits it and waits for it to close. */
async function submitDialog(
  page: Page,
  trigger: string,
  fill: Record<string, string>,
  submit: string,
) {
  await page.getByRole("button", { name: trigger, exact: true }).click();
  const dialog = page.getByRole("dialog");
  for (const [label, value] of Object.entries(fill)) await dialog.getByLabel(label).fill(value);
  await dialog.getByRole("button", { name: submit }).click();
  await expect(dialog).toBeHidden();
}

test.describe("W7 licensing and benefit settlement", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w7 license to signed settlement commitment", async ({ page }) => {
    test.setTimeout(TERMINAL_TIMEOUT_MS + 120_000);

    // Partner requests a license with a valid fictional credential and runs the optional check.
    await signIn(page, "partner");
    await page.goto(W7_ROUTE);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    await page.getByLabel("Credential (optional, simulated)").selectOption(VALID_CREDENTIAL);
    await page.getByLabel("Scope").fill("E2E illustrative research scope");
    await page.getByRole("button", { name: "Request license" }).click();
    await page.waitForURL(LICENSE_URL);
    const licenseId = idFromUrl(page);
    await expect(page.getByText("Optional, simulated").first()).toBeVisible();
    await page.getByRole("button", { name: "Run credential check" }).click();
    await expect(page.getByTestId("credential-result")).toContainText("Verified");
    await expect(page.getByText("No attributes disclosed")).toBeVisible();

    // Tenant admin approves; the benefit item is created as planned.
    await switchPersona(page, "tenant_admin");
    await submitDialog(
      page,
      "Decide license",
      { Rationale: "Scope fits the agreement" },
      "Record decision",
    );
    await expect(page.locator('#summary-heading [data-state="approved"]')).toBeVisible();
    await expect(page.locator('[data-testid="benefit-item"][data-status="planned"]')).toHaveCount(
      1,
    );

    // Finance opens the settlement and records, reviews, approves and reconciles.
    await switchPersona(page, "finance");
    await page.getByRole("button", { name: "Create settlement" }).click();
    await page.waitForURL(SETTLEMENT_URL);
    const settlementId = idFromUrl(page);
    await page.getByLabel("Reference").fill("DEMO-E2E-001");
    await page.getByLabel("Amount (demo credits)").fill("600");
    await page.getByRole("button", { name: "Record receipt" }).click();
    await expect(row(page, "recorded")).toHaveCount(1);
    await page.getByRole("button", { name: "Mark reviewed" }).click();
    await submitDialog(
      page,
      "Approve evidence",
      { Rationale: "Evidence is complete" },
      "Confirm evidence approval",
    );
    await page.getByRole("button", { name: "Reconcile receipts" }).click();
    const lines = page.getByTestId("calc-line");
    await expect(lines).toHaveCount(4);
    await expect(page.getByTestId("illustrative-badge").first()).toBeVisible();
    await expect(lines.nth(0)).toContainText("150 demo credits");
    await expect(lines.nth(1)).toContainText("90 demo credits");
    await expect(lines.nth(2)).toContainText("Reserve (illustrative)");
    await expect(lines.nth(2)).toContainText("360 demo credits");
    await expect(lines.nth(3)).toContainText("0 demo credits");
    await expect(page.getByTestId("conservation")).toHaveText("Conserved: 600 demo credits");
    await expect(page.getByText("Frozen at reconciliation")).toBeVisible();

    // Dual approval: finance first (1 of 2), the same persona is refused, then tenant admin.
    const sha = (await (await bff(page, "GET", `/api/demo/settlements/${settlementId}`)).body)
      .calculation.sha256;
    await submitDialog(
      page,
      "Approve distribution",
      { Rationale: "Finance checked the split" },
      "Confirm approval",
    );
    await expect(page.getByTestId("approval-progress")).toContainText(
      "1 of 2 approvals — a different approver persona must also approve",
    );
    await expect(page.getByRole("button", { name: "Approve distribution" })).toBeDisabled();
    await expect(page.getByText("Distribution authorised")).toHaveCount(0);
    const second = await bff(page, "POST", `/api/demo/settlements/${settlementId}/approvals`, {
      calculation_sha256: sha,
      rationale: "forced second approval",
      idempotency_key: "e2e-second-finance-approval",
    });
    expect(second.status).toBe(409);
    expect(second.body.code).toBe("approver_already_approved");
    await switchPersona(page, "tenant_admin");
    await submitDialog(
      page,
      "Approve distribution",
      { Rationale: "Tenant admin checked" },
      "Confirm approval",
    );
    await expect(page.getByText("Distribution authorised")).toBeVisible();
    await expect(page.getByRole("list", { name: "Approvals" })).toContainText("Finance");
    await expect(page.getByRole("list", { name: "Approvals" })).toContainText("Tenant admin");

    // Distribution posts the ledger; final reconciliation signs the commitment with anchoring.
    await switchPersona(page, "finance");
    await page.getByRole("button", { name: "Distribute (demo credits)" }).click();
    await expect(page.getByTestId("ledger-row")).toHaveCount(4);
    await expect(page.getByTestId("ledger-conservation")).toHaveText("Conserved: 600 demo credits");
    await submitDialog(page, "Final reconciliation and commitment", {}, "Run final reconciliation");
    const commitment = page.getByTestId("commitment-card");
    await expect(commitment).toContainText("Demo signature, not production key");

    // Verify the commitment in W6.
    await commitment.getByRole("link", { name: "Verify in W6" }).click();
    await page.waitForURL(/\/demo\/w6-provenance\/events\/[^/]+$/);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    await page.getByRole("button", { name: "Verify signature" }).click();
    await expect(page.getByTestId("verify-result")).toHaveText("Valid");

    // The anchor settles on its own (polling, no reload).
    await page.goBack();
    await expect(page.getByTestId("anchor-status")).toContainText("Anchored", {
      timeout: ANCHOR_TIMEOUT_MS,
    });
    await expect(page.getByText(/DEMO-ANCHOR-/)).toBeVisible();

    // The community liaison schedules and delivers the benefit; beneficiaries show the shares.
    await as(page, "community_liaison");
    await page.goto(`${W7_ROUTE}/licenses/${licenseId}`);
    await submitDialog(page, "Schedule", { "Scheduled for": "2030-02-01" }, "Confirm schedule");
    await expect(page.locator('[data-testid="benefit-item"][data-status="scheduled"]')).toHaveCount(
      1,
    );
    await submitDialog(
      page,
      "Mark delivered",
      { "Evidence note": "Attendance sheet filed" },
      "Confirm delivery",
    );
    await expect(page.locator('[data-testid="benefit-item"][data-status="delivered"]')).toHaveCount(
      1,
    );
    await page.goto(W7_ROUTE);
    const totals = page.getByTestId("beneficiary-total");
    await expect(totals.filter({ hasText: "150 demo credits" })).toHaveCount(1);
    await expect(totals.filter({ hasText: "90 demo credits" })).toHaveCount(1);
  });

  test("w7 disputed receipt holds payout, duplicate rejected, anchoring pending during outage", async ({
    page,
  }) => {
    test.setTimeout(TERMINAL_TIMEOUT_MS + 120_000);
    await signIn(page, "finance");

    // The seeded example is disputed: recorded 400, a struck duplicate and a held 250.
    const list = await bff(page, "GET", "/api/demo/settlements");
    const seeded = list.body.items.find(
      (s: { display_id: string }) => s.display_id === "DEMO-S-001",
    );
    await page.goto(`${W7_ROUTE}/settlements/${seeded.id}`);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    await expect(page.locator('#state-heading [data-state="disputed"]')).toBeVisible();
    await expect(row(page, "recorded")).toContainText("400 demo credits");
    await expect(row(page, "duplicate")).toContainText("rejected, not counted");
    await expect(row(page, "duplicate").locator(".line-through").first()).toBeVisible();
    await expect(row(page, "disputed")).toContainText("250 demo credits");
    await expect(row(page, "disputed")).toContainText("held — not payable");
    await expect(page.getByText("No payout: nothing has been posted")).toBeVisible();
    await expect(page.getByText("No signed events: seeded example")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Reconcile|Distribute|Approve distribution/ }),
    ).toHaveCount(0);
    for (const path of ["reconcile", "distribution"]) {
      const forced = await bff(page, "POST", `/api/demo/settlements/${seeded.id}/${path}`, {
        idempotency_key: `e2e-forced-${path}`,
      });
      expect(forced.status).toBe(409);
      expect(forced.body.code).toBe("settlement_state_conflict");
    }

    // A duplicate reference is rejected visibly; totals stay put; a partner cannot create one.
    const { settlement, license } = await settlementAt(page, "submitted", { amount: 600 });
    await page.goto(`${W7_ROUTE}/settlements/${settlement.id}`);
    const totalsBefore = await page.getByTestId("receipt-totals").textContent();
    const live = await row(page, "recorded").locator("td").first().textContent();
    await page.getByLabel("Reference").fill(live?.trim() ?? "");
    await page.getByLabel("Amount (demo credits)").fill("600");
    await page.getByRole("button", { name: "Record receipt" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Duplicate receipt rejected — not counted" }),
    ).toBeVisible();
    await expect(row(page, "duplicate")).toHaveCount(1);
    await expect(page.getByTestId("receipt-totals")).toContainText("600 demo credits recorded");
    expect(totalsBefore).toContain("600 demo credits recorded");
    await as(page, "partner");
    const partner = await bff(page, "POST", "/api/demo/settlements", {
      license_id: license.id,
      idempotency_key: "e2e-partner-forced",
    });
    expect(partner.status).toBe(403);
    expect(partner.body.code).toBe("persona_forbidden");

    // Anchoring during a simulated outage: audited and signed at once, the anchor stays pending.
    const paid = await settlementAt(page, "paid");
    await page.goto(W7_ROUTE);
    const toggle = page.getByRole("switch", { name: "Simulate chain outage (demo)" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("outage-status")).toContainText(
      "Chain outage simulated — new anchors stay pending",
    );
    await page.goto(`${W7_ROUTE}/settlements/${paid.settlement.id}`);
    await submitDialog(page, "Final reconciliation and commitment", {}, "Run final reconciliation");
    await expect(page.locator('#state-heading [data-state="audited"]')).toBeVisible();
    await expect(page.getByTestId("commitment-card")).toContainText(
      "Demo signature, not production key",
    );
    await expect(page.getByTestId("anchor-status")).toContainText("Pending");

    // Meanwhile another simulated job (scientist) reaches a terminal state.
    await switchPersona(page, "scientist");
    await page.goto("/demo/jobs");
    await page.getByRole("button", { name: "Start simulated screening" }).click();
    await page.waitForURL(/\/demo\/jobs\/[^/]+$/);
    await expect
      .poll(async () => page.getByTestId("job-state").getAttribute("data-state"), {
        timeout: TERMINAL_TIMEOUT_MS,
      })
      .toMatch(/SUCCEEDED|FAILED|CANCELLED/);
    await as(page, "finance");
    await page.goto(`${W7_ROUTE}/settlements/${paid.settlement.id}`);
    await expect(page.getByTestId("anchor-status")).toContainText("Pending");

    // Switching the outage off lets the anchor finish.
    await page.goto(W7_ROUTE);
    await page.getByRole("switch", { name: "Simulate chain outage (demo)" }).click();
    await expect(
      page.getByRole("switch", { name: "Simulate chain outage (demo)" }),
    ).toHaveAttribute("aria-checked", "false");
    await page.goto(`${W7_ROUTE}/settlements/${paid.settlement.id}`);
    await expect(page.getByTestId("anchor-status")).toContainText("Anchored", {
      timeout: ANCHOR_TIMEOUT_MS,
    });
    await expect(page.getByText(/DEMO-ANCHOR-/)).toBeVisible();
  });

  test("w7 pages have zero axe violations and the banner", async ({ page }) => {
    test.setTimeout(TERMINAL_TIMEOUT_MS);
    await signIn(page, "finance");
    const { settlement, license } = await settlementAt(page, "reconciled");
    const scan = async (route: string) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
      await expectNoAxeViolations(page);
    };
    await scan(W7_ROUTE);
    await scan(`${W7_ROUTE}/licenses/${license.id}`);
    await scan(`${W7_ROUTE}/settlements/${settlement.id}`);
    // Dialog open: approval and dispute dialogs.
    await page.getByRole("button", { name: "Approve distribution", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Close" }).click();
    await page.goto(`${W7_ROUTE}/settlements/${settlement.id}`);
    await as(page, "partner");
    await scan(W7_ROUTE);
  });
});
