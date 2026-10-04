// Next's vendored path-to-regexp ships without types; next-config.test.ts uses it to check `source`
// patterns with the same compiler Next uses.
declare module "next/dist/compiled/path-to-regexp" {
  export function pathToRegexp(path: string): RegExp;
}
