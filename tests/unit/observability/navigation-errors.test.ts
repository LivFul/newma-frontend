import { describe, expect, it } from "vitest";
import { isBenignNavigationAbort } from "@/lib/observability/navigation-errors";

describe("isBenignNavigationAbort", () => {
  it("matches the Next.js client transition abort message", () => {
    const error = new Error("AbortError: Transition was skipped. Navigation aborted");
    expect(isBenignNavigationAbort(error)).toBe(true);
    expect(isBenignNavigationAbort(error.message)).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isBenignNavigationAbort(new Error("boom"))).toBe(false);
    expect(isBenignNavigationAbort(new DOMException("The operation was aborted", "AbortError"))).toBe(
      false,
    );
  });
});
