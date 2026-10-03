// Tour driver, steps 6 to 11: agent (W3), gates (W4), wet-lab loop (W5), provenance (W6).
import type { Page } from "@playwright/test";
import { JOB_TIMEOUT_MS, SLOW_MS, type StepRun } from "./tour-context";
import { expect } from "./test";
import { openCandidate, signGate } from "./w4";

const W3 = "/demo/w3-agent";
const W5 = "/demo/w5-wet-lab";
const agentStatus = (page: Page) => page.getByTestId("agent-status");
const packageStatus = (page: Page) => page.getByTestId("work-package-status");

async function ask(page: Page, budget?: string): Promise<void> {
  await page.goto(W3);
  if (budget) await page.getByLabel("Budget (demo credits)").fill(budget);
  await page.getByRole("button", { name: "Ask the simulated agent" }).click();
  await page.waitForURL(/\/demo\/w3-agent\?query=/);
}

export const w3Agent: StepRun = async (page, ctx) => {
  await ask(page);
  await expect
    .poll(() => agentStatus(page).getAttribute("data-status"), {
      timeout: JOB_TIMEOUT_MS,
      intervals: [1000],
    })
    .toBe("completed");
  await expect(
    page.getByRole("list", { name: "Ranked hypotheses" }).getByRole("listitem").first(),
  ).toContainText("Synthetic");
  await expect(page.getByText("Retried after simulated failure")).toHaveCount(1);
  await expect(page.getByText("Simulated agent").first()).toBeVisible();
  const proposal = page.getByRole("link", { name: "Submit as work package in W5" });
  await expect(proposal).toBeVisible();
  ctx.w5Href = (await proposal.getAttribute("href")) ?? undefined;

  await ask(page, "10");
  await expect
    .poll(() => agentStatus(page).getAttribute("data-status"), { timeout: 30_000 })
    .toBe("held");
  const hold = page.getByRole("region", { name: "Budget hold" });
  await expect(hold).toContainText("Held");
  await expect(hold).toContainText("Remediation");
};

export const w4Gates: StepRun = async (page, ctx) => {
  const displayId = await openCandidate(page, 2);
  const h1 = await signGate(page, "H1", displayId);
  await expect(h1.dialog).toBeHidden({ timeout: SLOW_MS });
  ctx.gateId = h1.gateId ?? undefined;
  await expect(page.getByTestId("signed-decision")).toContainText(
    "Demo signature, not production key",
  );
  const rankOne = await openCandidate(page, 1);
  const h2 = await signGate(page, "H2", rankOne);
  const alert = h2.dialog.getByRole("alert");
  await expect(alert).toContainText("gate_requirements_missing");
  await expect(alert.getByRole("listitem")).toHaveCount(3);
  await h2.dialog.getByRole("button", { name: "Close" }).click();
};

export const w5Package: StepRun = async (page, ctx) => {
  // The visitor arrives from the W3 proposal link, which prefills the form.
  await page.goto(ctx.w5Href ?? W5);
  await page.getByLabel("Scenario").selectOption("missing_sample");
  await page.getByRole("button", { name: "Submit work package" }).click();
  await page.waitForURL(/\/demo\/w5-wet-lab\/[^/?]+$/);
  ctx.packageUrl = page.url();
  await expect(page.getByText("Mock ELN").first()).toBeVisible();
  await expect(page.getByText("Simulated workflow engine").first()).toBeVisible();
  await expect
    .poll(() => packageStatus(page).getAttribute("data-status"), {
      timeout: JOB_TIMEOUT_MS,
      intervals: [1000],
    })
    .toMatch(/results_available|in_review/);
};

export const w5Import: StepRun = async (page, ctx) => {
  await page.goto(ctx.packageUrl ?? W5);
  await page.getByRole("button", { name: "Import results" }).click();
  await expect(page.getByTestId("observation-count")).toBeVisible();
  await expect(page.getByText(/checksum [0-9a-f]{16,}/)).toBeVisible();
  await expect(page.getByTestId("reconciliation-status")).toHaveText("HOLD");
};

export const w5Accept: StepRun = async (page, ctx) => {
  await page.goto(ctx.packageUrl ?? W5);
  const held = page.locator("tr[data-status]:not([data-status=matched])").first();
  await held.getByRole("button", { name: /Record disposition/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Rationale").fill("Sample S-03 was not shipped; excluded");
  await dialog.getByRole("button", { name: "Record disposition" }).click();
  await expect(page.getByTestId("reconciliation-status")).toHaveText("reconciled");
  await page.getByRole("button", { name: "Accept results" }).click();
  await page.getByLabel("Rationale").fill("Reconciled synthetic replicates are consistent");
  await page.getByRole("button", { name: "Confirm acceptance" }).click();
  await expect(page.getByText("Accepted by NEWMA scientist").first()).toBeVisible();
  const proposal = page.getByTestId("retraining-proposal").first();
  await expect(proposal).toContainText("Blocked pending separate authorization");
};

const verifyResult = (page: Page) => page.getByTestId("verify-result");

export const w6Verify: StepRun = async (page, ctx) => {
  await page.goto(`/demo/w6-provenance/gate/${ctx.gateId}`);
  await expect(page.locator('[data-event-type="gate.decided"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Verify signature" }).click();
  await expect(verifyResult(page)).toHaveText("Valid");
  const toggle = page.getByRole("switch", { name: "Demo tamper toggle" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Verify signature" }).click();
  await expect(verifyResult(page)).toHaveText(/Invalid/);
  await expect(page.getByRole("status", { name: "Verification result" })).toContainText(
    "signature_mismatch",
  );
};
