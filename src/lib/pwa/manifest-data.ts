import type { MetadataRoute } from "next";
import { BACKGROUND_HEX, BRAND_HEX } from "@/lib/brand";
import manifest from "@/app/manifest";

export function getManifest(): MetadataRoute.Manifest {
  return manifest();
}

export const PWA_THEME = {
  background: BACKGROUND_HEX,
  accent: BRAND_HEX.accent,
} as const;
