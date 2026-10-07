import type { Page, Response } from "@playwright/test";
import { WORKFLOW_CONTROLS, WORKFLOW_SECTION } from "../../src/content/home/workflow";
import { expect, test } from "../support/test";
import { horizontalOverflow } from "../support/reflow";

const EXPLORE = WORKFLOW_CONTROLS.explore.text;
const BACK = WORKFLOW_CONTROLS.close.text;
const DIAGRAM = WORKFLOW_SECTION.svgTitle.text;
/**
 * Only the three.js scene chunk carries three's renderer messages. Size alone is no test: a hosting
 * build can split framework chunks differently, and one of those passed 300 KB on a preview.
 */
const SCENE_CHUNK_MARKER = "THREE.WebGLRenderer";

async function hasWebGL(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  });
}

/**
 * Opens the three-dimensional view and waits for it to settle. When the scene reports a failure, the
 * test fails with that message unless this browser cannot create the kind of WebGL context the scene
 * asks for, which is an environment limit and skips instead of hiding a real scene bug.
 */
async function openScene(page: Page, how: "click" | "keyboard" = "click"): Promise<void> {
  const button = page.getByRole("button", { name: EXPLORE });
  if (how === "keyboard") {
    await button.focus();
    await page.keyboard.press("Enter");
  } else {
    await button.click();
  }
  const viewer = page.locator("[data-workflow-viewer]");
  await expect(viewer).toHaveAttribute("data-phase", /^(ready|failed|unavailable)$/, {
    timeout: 30_000,
  });
  if ((await viewer.getAttribute("data-phase")) !== "ready") {
    const contextWorks = await page.evaluate(() =>
      Boolean(document.createElement("canvas").getContext("webgl2", { antialias: true })),
    );
    test.skip(!contextWorks, "this browser cannot create the antialiased WebGL context");
    throw new Error("The scene reported a failure although WebGL is available");
  }
  await expect(page.locator("[data-workflow-scene] canvas")).toBeVisible();
}

test("the workflow sits between the product introduction and the six components", async ({
  page,
}) => {
  await page.goto("/");
  const ids = await page
    .locator("section[id]")
    .evaluateAll((sections) => sections.map((section) => section.id));
  const workflow = ids.indexOf("workflow");
  expect(workflow).toBeGreaterThan(-1);
  expect(ids[workflow - 1]).toBe("product");
  expect(ids[workflow + 1]).toBe("components");
  await expect(page.locator("#workflow h2")).toHaveText(WORKFLOW_SECTION.heading.text);
});

test("the six components index is unchanged by the new section", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#components").getByRole("link")).toHaveCount(6);
  await expect(page.getByRole("link", { name: "Explore the demo" })).toHaveCount(4);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the diagram and the text version work and no dead button appears", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("img", { name: DIAGRAM })).toBeVisible();
    await expect(page.getByRole("button", { name: EXPLORE })).toHaveCount(0);

    await page.getByText(WORKFLOW_CONTROLS.textSummary.text).click();
    await expect(page.locator("#workflow details")).toHaveAttribute("open", "");
    await expect(page.locator("#workflow details li").first()).toBeVisible();
  });
});

test("nothing of the three-dimensional view loads until it is asked for", async ({ page }) => {
  const loaded: Response[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "script") loaded.push(response);
  });
  await page.goto("/", { waitUntil: "networkidle" });
  // Past the hero's own idle swap, so only what the section itself pulls in could appear.
  await page.waitForTimeout(3_000);
  const sceneChunks = await Promise.all(
    loaded.map(async (response) => {
      const body = await response.body().catch(() => Buffer.alloc(0));
      return body.includes(SCENE_CHUNK_MARKER) ? response.url() : null;
    }),
  );
  expect(sceneChunks.filter(Boolean)).toEqual([]);
  await expect(page.locator("[data-workflow-scene]")).toHaveCount(0);
});

test("explore opens the three-dimensional view and back returns to the diagram", async ({
  page,
}) => {
  await page.goto("/");
  test.skip(!(await hasWebGL(page)), "this browser has no WebGL");

  const scripts: string[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "script") scripts.push(response.url());
  });
  const before = new Set(
    await page.evaluate(() => performance.getEntriesByType("resource").map((e) => e.name)),
  );

  await openScene(page);
  const canvas = page.locator("[data-workflow-scene] canvas");
  // The hero has a status region of its own, so scope this one to the viewer.
  await expect(page.locator("[data-workflow-viewer] [role=status]")).toHaveText(
    WORKFLOW_CONTROLS.ready.text,
  );
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0).toBeGreaterThan(200);
  expect(scripts.filter((url) => !before.has(url)).length).toBeGreaterThan(0);

  for (const control of [
    WORKFLOW_CONTROLS.panUp,
    WORKFLOW_CONTROLS.tiltUp,
    WORKFLOW_CONTROLS.zoomIn,
    WORKFLOW_CONTROLS.reset,
  ]) {
    await expect(page.getByRole("button", { name: control.text })).toBeVisible();
  }

  await page.getByRole("button", { name: BACK }).click();
  await expect(page.getByRole("img", { name: DIAGRAM })).toBeVisible();
  await expect(page.locator("[data-workflow-scene]")).toHaveCount(0);
});

test("the three-dimensional view works from the keyboard and closes with Escape", async ({
  page,
}) => {
  await page.goto("/");
  test.skip(!(await hasWebGL(page)), "this browser has no WebGL");

  await openScene(page, "keyboard");
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-workflow-scene]")).toHaveCount(0);
  await expect(page.getByRole("img", { name: DIAGRAM })).toBeVisible();
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the view still opens on request", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await hasWebGL(page)), "this browser has no WebGL");
    await openScene(page);
  });
});

test("the section never makes the page scroll sideways at 320 px, open or closed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

  // The diagram scrolls inside its own region instead.
  const region = page.getByRole("region", { name: WORKFLOW_CONTROLS.region.text });
  const scrolls = await region.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(scrolls).toBe(true);

  if (await hasWebGL(page)) {
    await openScene(page);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  }
});
