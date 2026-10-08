import { readFileSync } from "node:fs";
import path from "node:path";

let cached: string | undefined;

// next/og cannot fetch /brand at build time. The primary lockup (brand pack v1.0, cropped to its ink)
// is inlined as a data URI; satori renders SVG images, so it stays vector.
export function brandLogoSrc(): string {
  if (!cached) {
    const file = path.join(process.cwd(), "public/brand/newma-logo.svg");
    const bytes = readFileSync(file).toString("base64");
    cached = `data:image/svg+xml;base64,${bytes}`;
  }
  return cached;
}
