import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Demo sign-in — NEWMA",
  description: "Pick a persona to enter the NEWMA demo. Synthetic data only; no passwords.",
  robots: { index: false, follow: false },
};

export default function AccessLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
