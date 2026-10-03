/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS config consumed by lhci */
// Desktop Lighthouse CI run; the budgets and URLs live in lighthouserc.shared.cjs.
const { buildConfig } = require("./lighthouserc.shared.cjs");

module.exports = buildConfig({ preset: "desktop" });
