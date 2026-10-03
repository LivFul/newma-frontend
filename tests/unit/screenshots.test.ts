import { describe, expect, it } from "vitest";
import { captureShots, DEVICES, planShots } from "../../scripts/screenshots.mjs";

type Shot = { url: string; file: string; device: string; state: string; route: string };

describe("planShots", () => {
  const shots = planShots("http://localhost:3100") as Shot[];

  it("is deterministic", () => {
    expect(planShots("http://localhost:3100")).toEqual(shots);
  });

  it("covers the home page, the provenance page and a legal page on desktop and mobile", () => {
    for (const route of ["/", "/ecosystem/provenance-dlt", "/legal/privacy"]) {
      for (const device of ["desktop", "mobile"]) {
        expect(
          shots.some((s) => s.route === route && s.device === device && s.state === "full"),
          `${route} ${device}`,
        ).toBe(true);
      }
    }
  });

  it("adds the hero exploded through the toggle and a reduced-motion variant, on both devices", () => {
    for (const device of ["desktop", "mobile"]) {
      expect(
        shots.some((s) => s.route === "/" && s.device === device && s.state === "exploded"),
      ).toBe(true);
      expect(
        shots.some((s) => s.route === "/" && s.device === device && s.state === "reduced-motion"),
      ).toBe(true);
    }
    expect(shots).toHaveLength(10);
  });

  it("names files docs/screenshots/<route-slug>-<device>-<state>.png", () => {
    expect(shots.map((s) => s.file)).toEqual(
      expect.arrayContaining([
        "docs/screenshots/home-desktop-full.png",
        "docs/screenshots/home-mobile-exploded.png",
        "docs/screenshots/ecosystem-provenance-dlt-mobile-full.png",
        "docs/screenshots/legal-privacy-desktop-full.png",
        "docs/screenshots/home-desktop-reduced-motion.png",
      ]),
    );
    expect(new Set(shots.map((s) => s.file)).size).toBe(shots.length);
    for (const s of shots)
      expect(s.file).toMatch(
        /^docs\/screenshots\/[a-z-]+-(desktop|mobile)-(full|exploded|reduced-motion)\.png$/,
      );
  });

  it("builds absolute URLs from the base, tolerating a trailing slash", () => {
    const withSlash = planShots("https://preview.example/") as Shot[];
    expect(withSlash[0]!.url).toMatch(/^https:\/\/preview\.example\//);
    expect(
      withSlash.every((s) => !s.url.includes("//ecosystem") && !s.url.includes("example//")),
    ).toBe(true);
  });

  it("rejects a non-http(s) base URL", () => {
    expect(() => planShots("file:///etc/passwd")).toThrow(/http/);
    expect(() => planShots("javascript:alert(1)")).toThrow(/http/);
    expect(() => planShots("not a url")).toThrow();
  });

  it("describes the two devices (desktop 1440 by 900, Pixel 7)", () => {
    expect(DEVICES.desktop.viewport).toEqual({ width: 1440, height: 900 });
    expect(DEVICES.mobile.name).toBe("Pixel 7");
  });
});

describe("captureShots", () => {
  it("never fetches third-party URLs: an off-origin plan entry is rejected before any browser starts", async () => {
    await expect(
      captureShots({
        baseUrl: "http://localhost:3100",
        plan: [
          {
            url: "https://example.com/",
            file: "x.png",
            device: "desktop",
            state: "full",
            route: "/",
          },
        ],
        launch: () => {
          throw new Error("browser must not start");
        },
      }),
    ).rejects.toThrow(/origin/);
  });
});
