import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/analytics/next", () => ({ Analytics: () => <div data-testid="va" /> }));

import { AnalyticsMount, beforeSend } from "@/components/site/analytics-mount";

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

describe("beforeSend", () => {
  it("strips the query string and hash from reported URLs", () => {
    const sent = beforeSend({
      type: "pageview",
      url: "https://newma.example/ecosystem/wet-lab?x=1#top",
    });
    expect(sent).toEqual({ type: "pageview", url: "https://newma.example/ecosystem/wet-lab" });
  });
  it("drops events from the demo and the sign-in page, whatever the host", () => {
    for (const path of ["/demo", "/demo/w3-agent?s=1", "/access", "/access?reason=expired"]) {
      expect(beforeSend({ type: "event", url: `https://newma.example${path}` }), path).toBeNull();
    }
  });
  it("keeps site paths that merely start with the same letters", () => {
    expect(beforeSend({ type: "event", url: "https://newma.example/accessible" })).not.toBeNull();
  });
});
