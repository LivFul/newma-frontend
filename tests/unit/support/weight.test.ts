import { describe, expect, it } from "vitest";
import {
  W10_WEIGHT_BUDGET_BYTES,
  assertLight,
  createWeightTracker,
  formatBreakdown,
  isProductionTarget,
  sumBytes,
} from "../../support/weight";

const sent = (requestId: string, url: string, type: string) => ({
  requestId,
  type,
  request: { url },
});

describe("W10_WEIGHT_BUDGET_BYTES", () => {
  it("is 200 KB", () => {
    expect(W10_WEIGHT_BUDGET_BYTES).toBe(204_800);
  });
});

describe("createWeightTracker", () => {
  it("sums encodedDataLength of every finished request, the document included", () => {
    const tracker = createWeightTracker();
    tracker.requestSent(sent("1", "http://h/demo/w10-custodian", "Document"));
    tracker.requestSent(sent("2", "http://h/_next/static/a.js", "Script"));
    tracker.loadingFinished({ requestId: "1", encodedDataLength: 12_000 });
    tracker.loadingFinished({ requestId: "2", encodedDataLength: 30_000 });
    const result = tracker.result();
    expect(result.total).toBe(42_000);
    expect(result.requests).toEqual([
      { url: "http://h/demo/w10-custodian", type: "Document", bytes: 12_000 },
      { url: "http://h/_next/static/a.js", type: "Script", bytes: 30_000 },
    ]);
  });

  it("follows a redirect: the last URL for a request id wins and both hops count once", () => {
    const tracker = createWeightTracker();
    tracker.requestSent(sent("1", "http://h/a", "Document"));
    tracker.requestSent({ ...sent("1", "http://h/b", "Document"), redirectResponse: {} });
    tracker.loadingFinished({ requestId: "1", encodedDataLength: 500 });
    expect(tracker.result().requests).toEqual([
      { url: "http://h/b", type: "Document", bytes: 500 },
    ]);
  });

  it("counts a failed request as zero bytes and ignores unknown ids", () => {
    const tracker = createWeightTracker();
    tracker.requestSent(sent("1", "http://h/x.js", "Script"));
    tracker.loadingFailed({ requestId: "1" });
    tracker.loadingFinished({ requestId: "ghost", encodedDataLength: 99 });
    expect(tracker.result()).toEqual({
      total: 0,
      requests: [{ url: "http://h/x.js", type: "Script", bytes: 0 }],
    });
  });

  it("reports unfinished requests as pending", () => {
    const tracker = createWeightTracker();
    tracker.requestSent(sent("1", "http://h/slow.js", "Script"));
    expect(tracker.pending()).toBe(1);
    tracker.loadingFinished({ requestId: "1", encodedDataLength: 1 });
    expect(tracker.pending()).toBe(0);
  });
});

describe("sumBytes and formatBreakdown", () => {
  const requests = [
    { url: "http://h/a", type: "Document", bytes: 1_500 },
    { url: "http://h/b.js", type: "Script", bytes: 3_000 },
  ];

  it("sums bytes", () => {
    expect(sumBytes(requests)).toBe(4_500);
    expect(sumBytes([])).toBe(0);
  });

  it("lists the biggest resource first with its type and bytes", () => {
    const text = formatBreakdown(requests);
    expect(text.split("\n")[0]).toContain("http://h/b.js");
    expect(text).toContain("Script");
    expect(text).toContain("3000");
    expect(text).toContain("total 4500");
  });
});

describe("assertLight", () => {
  const ok = { url: "http://h/a.js", type: "Script", bytes: 1 };

  it("accepts documents, scripts, stylesheets, SVG images and fetches", () => {
    expect(
      assertLight([
        ok,
        { url: "http://h/s.css", type: "Stylesheet", bytes: 1 },
        { url: "http://h/i.svg", type: "Image", bytes: 1 },
        { url: "data:image/svg+xml;base64,AAA", type: "Image", bytes: 0 },
        { url: "http://h/api", type: "Fetch", bytes: 1 },
      ]),
    ).toEqual([]);
  });

  it("rejects fonts and raster images", () => {
    const bad = assertLight([
      ok,
      { url: "http://h/f.woff2", type: "Font", bytes: 9 },
      { url: "http://h/p.png", type: "Image", bytes: 9 },
      { url: "http://h/p.svg.png", type: "Image", bytes: 9 },
    ]);
    expect(bad.map((r) => r.url)).toEqual([
      "http://h/f.woff2",
      "http://h/p.png",
      "http://h/p.svg.png",
    ]);
  });
});

describe("isProductionTarget", () => {
  it("is true for a deployed host or when PLAYWRIGHT_PROD_BUILD=1", () => {
    expect(isProductionTarget("https://newma-frontend.vercel.app", undefined)).toBe(true);
    expect(isProductionTarget("https://preview-abc.vercel.app", undefined)).toBe(true);
  });

  it("is false for a local server unless the flag is set", () => {
    expect(isProductionTarget("http://localhost:3102", undefined)).toBe(false);
    expect(isProductionTarget("http://localhost:3102", "1")).toBe(true);
    expect(isProductionTarget("http://localhost:3102", "0")).toBe(false);
  });
});
