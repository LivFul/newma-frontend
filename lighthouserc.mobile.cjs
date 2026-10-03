/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS config consumed by lhci */
// Mobile Lighthouse CI run (Lighthouse's default mobile emulation); budgets in lighthouserc.shared.cjs.
const { buildConfig } = require("./lighthouserc.shared.cjs");

module.exports = buildConfig({ preset: "mobile" });
