import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("web app manifest", () => {
  it("is installable with maskable icons and app shortcuts", () => {
    const data = manifest();
    expect(data.display).toBe("standalone");
    expect(data.start_url).toBe("/");
    expect(data.icons?.some((icon) => icon.purpose === "maskable")).toBe(true);
    expect(data.icons?.some((icon) => icon.sizes === "512x512")).toBe(true);
    expect(data.shortcuts?.map((item) => item.url)).toEqual(["/access", "/#components"]);
  });
});
