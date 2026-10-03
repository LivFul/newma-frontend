import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Production (or a build outside Vercel) is crawlable except /api/. Previews and every other Vercel
// environment disallow everything, on top of Vercel's own X-Robots-Tag (assumption A-P4-10).
// /access, /demo and /primitives are deliberately not disallowed: a crawler must be able to fetch them
// to see their noindex (assumption A-P4-11).
export default function robots(): MetadataRoute.Robots {
  const vercelEnv = process.env.VERCEL_ENV;
  const isPublic = !vercelEnv || vercelEnv === "production";
  if (!isPublic) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
