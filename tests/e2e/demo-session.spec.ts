import { expect, test } from "../support/test";
import {
  PERSONA_LABELS,
  type PersonaId,
  currentPersona,
  needsBackend,
  signIn,
  signOut,
} from "../support/demo";

const PERSONAS = Object.keys(PERSONA_LABELS) as PersonaId[];

test.describe("demo session", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  for (const persona of PERSONAS) {
    test(`signs in as ${persona} and the header shows "${PERSONA_LABELS[persona]}"`, async ({
      page,
    }) => {
      await signIn(page, persona);
      await expect(currentPersona(page)).toHaveText(PERSONA_LABELS[persona]);
    });
  }

  test("switching persona changes the header label", async ({ page }) => {
    await signIn(page, "scientist");
    const switched = page.waitForResponse((r) => r.url().endsWith("/api/demo/sessions/persona"));
    await page.getByRole("combobox", { name: "Persona" }).selectOption("finance");
    expect((await switched).status()).toBe(200);
    // next dev may still be compiling the refreshed server tree.
    await expect(currentPersona(page)).toHaveText("Finance", { timeout: 30_000 });
  });

  test("sign-out lands on /access and /demo then redirects back to /access", async ({ page }) => {
    await signIn(page, "scientist");
    await signOut(page);
    await page.goto("/demo");
    await page.waitForURL("**/access");
  });

  test("keeps no token or session id in browser storage, URL or document.cookie", async ({
    page,
  }) => {
    await signIn(page, "data_steward");
    const storage = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      cookie: document.cookie,
      url: location.href,
    }));
    expect(storage.local).toEqual([]);
    expect(storage.session).toEqual([]);
    expect(storage.cookie).not.toContain("newma_demo_sid");
    expect(storage.url).not.toMatch(/sid|token/i);
    // The session cookie exists but is HttpOnly, so the page could not read it above.
    const cookies = await page.context().cookies();
    const session = cookies.find((c) => c.name.endsWith("newma_demo_sid"));
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");
    expect(session?.path).toBe("/");
  });

  test("/access never redirects anywhere but /demo", async ({ page }) => {
    await page.goto("/access?next=https://example.org/");
    await page.getByRole("button", { name: "Scientist" }).click();
    await page.waitForURL("**/demo");
    expect(new URL(page.url()).pathname).toBe("/demo");
  });
});
