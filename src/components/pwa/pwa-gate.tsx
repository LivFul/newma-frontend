"use client";

import nextDynamic from "next/dynamic";

const PwaMount = nextDynamic(
  () => import("@/components/pwa/pwa-mount").then((mod) => mod.PwaMount),
  { ssr: false },
);

export function PwaGate() {
  return <PwaMount />;
}
