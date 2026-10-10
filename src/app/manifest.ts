import type { MetadataRoute } from "next";
import { HOME_META } from "@/content/home/copy";
import { BACKGROUND_HEX, BRAND_HEX } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NEWMA by LivFul Therapeutics",
    short_name: "NEWMA",
    description: HOME_META.defaultDescription.text,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: BACKGROUND_HEX,
    theme_color: BRAND_HEX.night,
    categories: ["productivity"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/brand/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Access NEWMA", short_name: "Access", url: "/access" },
      { name: "Components", short_name: "Components", url: "/ecosystem" },
    ],
  };
}
