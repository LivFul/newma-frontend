// First-load weight measurement for the W10 budget (A-P5B-16): encoded transfer in bytes over CDP,
// cache disabled, the document included. Measure a production build, never `next dev`.
import type { Page } from "@playwright/test";
import { targetKind } from "./target";

export const W10_WEIGHT_BUDGET_BYTES = 200 * 1024;

export type RequestWeight = Readonly<{ url: string; type: string; bytes: number }>;
export type WeightResult = Readonly<{ total: number; requests: readonly RequestWeight[] }>;

type Sent = Readonly<{
  requestId: string;
  type?: string;
  request: { url: string };
  redirectResponse?: unknown;
}>;
type Finished = Readonly<{ requestId: string; encodedDataLength: number }>;
type Failed = Readonly<{ requestId: string }>;

type Entry = { url: string; type: string; bytes: number; done: boolean };

/** Folds CDP Network events into per-request weights (pure, so it is unit-testable). */
export function createWeightTracker() {
  const entries = new Map<string, Entry>();
  return {
    requestSent(event: Sent): void {
      const known = entries.get(event.requestId);
      const entry = known ?? { url: "", type: event.type ?? "Other", bytes: 0, done: false };
      entries.set(event.requestId, { ...entry, url: event.request.url });
    },
    loadingFinished(event: Finished): void {
      const entry = entries.get(event.requestId);
      if (entry)
        entries.set(event.requestId, { ...entry, bytes: event.encodedDataLength, done: true });
    },
    loadingFailed(event: Failed): void {
      const entry = entries.get(event.requestId);
      if (entry) entries.set(event.requestId, { ...entry, bytes: 0, done: true });
    },
    pending: (): number => [...entries.values()].filter((e) => !e.done).length,
    result(): WeightResult {
      const requests = [...entries.values()].map(({ url, type, bytes }) => ({ url, type, bytes }));
      return { total: sumBytes(requests), requests };
    },
  };
}

export const sumBytes = (requests: readonly RequestWeight[]): number =>
  requests.reduce((total, request) => total + request.bytes, 0);

/** One line per resource, biggest first, then the total: attached when the budget fails. */
export function formatBreakdown(requests: readonly RequestWeight[]): string {
  const lines = [...requests]
    .sort((a, b) => b.bytes - a.bytes)
    .map((r) => `${String(r.bytes).padStart(8)} ${r.type.padEnd(10)} ${r.url}`);
  return [...lines, `total ${sumBytes(requests)}`].join("\n");
}

const isSvg = (url: string): boolean =>
  /^data:image\/svg\+xml/.test(url) || /\.svg(\?|#|$)/.test(url);

/** The resources the W10 page must not load: web fonts and raster images. */
export function assertLight(requests: readonly RequestWeight[]): readonly RequestWeight[] {
  return requests.filter(
    (request) => request.type === "Font" || (request.type === "Image" && !isSvg(request.url)),
  );
}

/** Weight is only meaningful on a production build: a deployed host or PLAYWRIGHT_PROD_BUILD=1. */
export function isProductionTarget(baseURL: string | undefined, flag: string | undefined): boolean {
  return flag === "1" || targetKind(baseURL) !== "local";
}

const SETTLE_POLL_MS = 100;
const SETTLE_TIMEOUT_MS = 15_000;

/** Navigates to `url` with the cache disabled and returns the encoded bytes of every request. */
export async function measureFirstLoad(page: Page, url: string): Promise<WeightResult> {
  const cdp = await page.context().newCDPSession(page);
  const tracker = createWeightTracker();
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  cdp.on("Network.requestWillBeSent", (event) => tracker.requestSent(event));
  cdp.on("Network.loadingFinished", (event) => tracker.loadingFinished(event));
  cdp.on("Network.loadingFailed", (event) => tracker.loadingFailed(event));
  await page.goto(url, { waitUntil: "networkidle" });
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;
  while (tracker.pending() > 0 && Date.now() < deadline) {
    await page.waitForTimeout(SETTLE_POLL_MS);
  }
  await cdp.detach();
  return tracker.result();
}
