import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/analytics/next", () => ({ Analytics: () => <div data-testid="va" /> }));

import { AnalyticsMount } from "@/components/site/analytics-mount";

function setWebdriver(value: boolean) {
  Object.defineProperty(navigator, "webdriver", { value, configurable: true });
}

describe("AnalyticsMount", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("renders nothing outside production", () => {
    setWebdriver(false);
    const { queryByTestId } = render(<AnalyticsMount />);
    expect(queryByTestId("va")).toBeNull();
  });
  it("renders nothing under automation, even in production", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    setWebdriver(true);
    const { queryByTestId } = render(<AnalyticsMount />);
    expect(queryByTestId("va")).toBeNull();
  });
  it("mounts the Vercel Web Analytics component in production for real browsers", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    setWebdriver(false);
    const { getByTestId } = render(<AnalyticsMount />);
    expect(getByTestId("va")).toBeInTheDocument();
  });
});
