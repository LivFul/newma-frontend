import type { MetadataRoute } from "next";
import { HOME_META } from "@/content/home/copy";
import { BACKGROUND_HEX } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEWMA",
    short_name: "NEWMA",
    description: HOME_META.defaultDescription.text,
    start_url: "/",
    display: "standalone",
    background_color: BACKGROUND_HEX,
    theme_color: BACKGROUND_HEX,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
