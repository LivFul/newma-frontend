import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDarkBlock, parseRuleBlock } from "@/lib/a11y/contrast";

const colorDark = readFileSync(
  path.resolve(__dirname, "../../../src/styles/tokens/color.dark.css"),
  "utf8",
);

describe("parseRuleBlock", () => {
  it("reads the first .dark block even when other .dark rules follow", () => {
    const css = `.dark { --color-bg: #041b21; }\n.dark ::selection { color: red; }\n`;
    expect(parseRuleBlock(css, ".dark {")["--color-bg"]).toBe("#041b21");
    expect(parseDarkBlock(colorDark)["--color-bg"]).toBe("#041b21");
    expect(Object.keys(parseDarkBlock(colorDark)).length).toBeGreaterThan(20);
  });
});
