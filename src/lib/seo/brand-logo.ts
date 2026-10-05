import { readFileSync } from "node:fs";
import path from "node:path";

let cached: string | undefined;

// next/og cannot fetch /brand at build time. The lockup is inlined as a data URI.
export function brandLogoSrc(): string {
  if (!cached) {
    const file = path.join(process.cwd(), "public/brand/logo-horizontal.png");
    const bytes = readFileSync(file).toString("base64");
    cached = `data:image/png;base64,${bytes}`;
  }
  return cached;
}
