import type { Metadata, Viewport } from "next";
import { Geologica, Martian_Mono } from "next/font/google";
import "./globals.css";
import { HOME_META } from "@/content/home/copy";
import { BACKGROUND_HEX } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

// Map lettering (display and UI) and the grid-reference mono. Self-hosted at build time, so no request
// reaches Google from the browser. The variables feed --font-sans, --font-display and --font-mono.
const geologica = Geologica({
  subsets: ["latin"],
  axes: ["SHRP"],
  variable: "--font-geologica",
  display: "swap",
});
const martian = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "NEWMA",
  description: HOME_META.defaultDescription.text,
};

export const viewport: Viewport = { colorScheme: "light", themeColor: BACKGROUND_HEX };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${geologica.variable} ${martian.variable}`}>
      <body className="flex min-h-full flex-col">
        {/* Pinned to the viewport origin while hidden: inside the page margin its 1px box would sit on top of
            the header links and fail the 24px target-offset check. */}
        <a
          href="#main"
          className="sr-only top-0 left-0 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
