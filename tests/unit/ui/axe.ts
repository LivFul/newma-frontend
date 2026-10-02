import axe from "axe-core";
import { expect } from "vitest";

export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      // jsdom has no layout engine; contrast is covered by tests/unit/tokens.test.ts.
      "color-contrast": { enabled: false },
      // Page-level landmark rule; bare components render without <main>. Covered by tests/a11y.
      region: { enabled: false },
    },
  });
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  expect(results.violations.map((v) => v.id)).toEqual([]);
}
