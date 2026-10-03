import { ImageResponse } from "next/og";
import { HERO } from "@/content/home/copy";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/seo/og";

export const alt = "NEWMA, a proposed platform for evidence-led ethnobotanical discovery";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(<OgCard title={HERO.title.text} />, { ...OG_SIZE });
}
