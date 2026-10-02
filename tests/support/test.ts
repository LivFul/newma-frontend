// Shared Playwright test: when a bypass secret is configured, requests that leave the baseURL origin
// have the Vercel bypass headers removed before they hit the network.
import { test as base } from "@playwright/test";
import { isSameOrigin, stripBypassHeaders } from "./bypass-headers";

export const test = base.extend({
  context: async ({ context, baseURL }, provide) => {
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET && baseURL) {
      await context.route(
        (url) => !isSameOrigin(url.href, baseURL),
        (route) => route.fallback({ headers: stripBypassHeaders(route.request().headers()) }),
      );
    }
    await provide(context);
  },
});

export { expect } from "@playwright/test";
