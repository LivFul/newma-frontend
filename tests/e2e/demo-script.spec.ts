// Walks the sprint-review demo script (docs/DEMO_SCRIPT.md, D-21) end to end: the same seven steps,
// the same personas, asserting the key on-screen result of each. Needs a real API behind the BFF
// (see README "Demo end-to-end run"), so it is skipped unless DEMO_E2E=1. The helpers are shared
// with the guided-tour driver; the steps live in tests/support/script-*.ts.
import { test } from "../support/test";
import { needsBackend } from "../support/demo";
import {
  SCRIPT_SPEED,
  approver,
  homepage,
  liaison,
  provenance,
  restoreServerSpeed,
  scientist,
  useDemoSpeed,
} from "../support/script-steps";
import { wetLab } from "../support/script-lab";
import { partnerAndFinance } from "../support/script-partner";
import type { TourContext } from "../support/tour-context";

const WALK_TIMEOUT_MS = 25 * 60_000;

test.describe("Sprint-review demo script", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);
  test.skip(({ isMobile }) => isMobile, "the script is presented on a desktop browser");

  test("seven steps from homepage to settlement", async ({ page }) => {
    test.setTimeout(WALK_TIMEOUT_MS);
    const ctx: TourContext = {};

    await test.step("1 Homepage: scroll, hover, Tab and Enter into Wet Lab, See it in the demo", () =>
      homepage(page));
    await useDemoSpeed(page, SCRIPT_SPEED);
    try {
      await test.step("2 Community liaison: W1 allow, hold, withdrawal; W10 concern", () =>
        liaison(page, ctx));
      await test.step("3 Scientist: W2 evidence labels; W3 agent, retry, hypotheses, hold", () =>
        scientist(page, ctx));
      await test.step("4 Scientific approver: W4 H0 to H1, H2 hold", () => approver(page, ctx));
      await test.step("5 Wet-lab / CRO: W5 package, missing sample, acceptance, blocked retraining", () =>
        wetLab(page, ctx));
      await test.step("6 W6: verify a signature, then tamper", () => provenance(page, ctx));
      await test.step("7 Partner and Finance: W8 export; W7 license to reconciliation; outage", () =>
        partnerAndFinance(page, ctx));
    } finally {
      await restoreServerSpeed(page);
    }
  });
});
