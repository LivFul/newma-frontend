import { expect, test } from "../support/test";

test("home responds 200 with the hero heading, main landmark and skip link first in tab order", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "NEWMA",
    }),
  ).toBeVisible();
  await expect(page.locator("main#main")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("primitives gallery responds 200 with its heading", async ({ page }) => {
  const response = await page.goto("/primitives");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Primitives" })).toBeVisible();
});
