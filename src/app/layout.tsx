import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "NEWMA",
  description: "NEWMA ethnobotanical drug-discovery platform by LivFul.",
};

// Mirrors --color-bg in src/styles/tokens/color.css (metadata cannot read CSS variables).
const BACKGROUND_HEX = "#0b1020";

export const viewport: Viewport = { colorScheme: "dark", themeColor: BACKGROUND_HEX };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-bg-elevated focus:px-4 focus:py-2 focus:text-fg"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
