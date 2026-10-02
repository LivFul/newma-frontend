import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "../support/test";

const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/** A throwaway origin (127.0.0.1 differs from localhost and from any preview host) that records headers. */
function thirdPartyOrigin(): Promise<{
  server: Server;
  url: string;
  headers: IncomingHttpHeaders[];
}> {
  const headers: IncomingHttpHeaders[] = [];
  const server = createServer((req, res) => {
    headers.push(req.headers);
    res.writeHead(204).end();
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, url: `http://127.0.0.1:${port}/ping`, headers });
    }),
  );
}

test.describe("Vercel protection bypass", () => {
  // Against an https preview the browser blocks the fetch to the plain-http 127.0.0.1 test server
  // (mixed content), so this runs only locally; tests/unit/bypass-headers.test.ts is the CI guarantee.
  test("is sent to the app origin but never to third parties", async ({ page, baseURL }) => {
    test.skip(
      !secret || new URL(baseURL ?? "").protocol !== "http:",
      "bypass stripping is verified locally against a plain-http origin",
    );
    const thirdParty = await thirdPartyOrigin();
    try {
      const appRequest = page.waitForRequest(`${baseURL}/`);
      await page.goto("/");
      expect((await (await appRequest).allHeaders())["x-vercel-protection-bypass"]).toBe(secret);

      await page.evaluate((url) => fetch(url, { mode: "no-cors" }), thirdParty.url);
      await expect.poll(() => thirdParty.headers.length).toBe(1);
      expect(thirdParty.headers[0]).not.toHaveProperty("x-vercel-protection-bypass");
      expect(thirdParty.headers[0]).not.toHaveProperty("x-vercel-set-bypass-cookie");
    } finally {
      thirdParty.server.close();
    }
  });
});
