import { expect, test } from "../support/test";
import { needsBackend, signIn } from "../support/demo";

const TERMINAL_TIMEOUT_MS = 120_000;
const TERMINAL_STATES = ["SUCCEEDED", "FAILED", "CANCELLED"];
// A one-shot proxy answers within one poll interval; a streaming one would hold the socket open.
const ONE_SHOT_BOUND_MS = 5_000;
const POLL_URL = /\/api\/demo\/jobs\/[^/]+$/;

const valueNow = async (page: import("@playwright/test").Page) =>
  Number(
    await page.getByRole("progressbar", { name: "Job progress" }).getAttribute("aria-valuenow"),
  );

test.describe("demo jobs", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("a simulated screening progresses across polls and reaches a terminal state", async ({
    page,
  }) => {
    test.setTimeout(TERMINAL_TIMEOUT_MS + 30_000);
    await signIn(page, "scientist");
    await page.goto("/demo/jobs");
    // Register the listener before the click that triggers navigation and the first poll.
    const firstPoll = page.waitForResponse((r) => POLL_URL.test(r.url()));
    await page.getByRole("button", { name: "Start simulated screening" }).click();
    await page.waitForURL(/\/demo\/jobs\/[^/]+$/);

    const poll = await firstPoll;
    expect(poll.headers()["cache-control"]).toBe("no-store");
    expect(poll.status()).toBe(200);

    // Progress must grow between polls unless the simulated run already finished while next dev
    // compiled the page.
    const first = await valueNow(page);
    if (first < 100) {
      await expect.poll(() => valueNow(page), { timeout: 30_000 }).toBeGreaterThan(first);
    }

    const badge = page.getByTestId("job-state");
    await expect
      .poll(async () => badge.getAttribute("data-state"), { timeout: TERMINAL_TIMEOUT_MS })
      .toMatch(new RegExp(TERMINAL_STATES.join("|")));
    await expect(page.getByText("Simulated workflow engine")).toBeVisible();
    await expect(page.getByText("Simulated compute")).toBeVisible();
  });

  test("an injected failure surfaces the retry notice", async ({ page }) => {
    test.setTimeout(TERMINAL_TIMEOUT_MS + 30_000);
    await signIn(page, "scientist");
    await page.goto("/demo/jobs");
    await page.getByRole("checkbox", { name: "Inject one retried failure" }).check();
    await page.getByRole("button", { name: "Start simulated screening" }).click();
    await page.waitForURL(/\/demo\/jobs\/[^/]+$/);
    await expect(page.getByRole("status")).toContainText(/Retried 1 time/, {
      timeout: TERMINAL_TIMEOUT_MS,
    });
  });

  test("the polling proxy responds at once (no streaming)", async ({ page }) => {
    await signIn(page, "scientist");
    await page.goto("/demo/jobs");
    const firstPoll = page.waitForResponse((r) => POLL_URL.test(r.url()));
    await page.getByRole("button", { name: "Start simulated screening" }).click();
    await page.waitForURL(/\/demo\/jobs\/[^/]+$/);
    // Playwright's timing().responseEnd is milliseconds relative to the request start (startTime
    // is an epoch timestamp, so never subtract the two): the body must be fully received quickly.
    const poll = await firstPoll;
    await poll.finished();
    const responseEnd = poll.request().timing().responseEnd;
    expect(responseEnd).toBeGreaterThan(0);
    expect(responseEnd).toBeLessThan(ONE_SHOT_BOUND_MS);
    expect(await poll.body()).not.toHaveLength(0);
  });
});
