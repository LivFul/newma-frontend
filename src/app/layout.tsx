import type { Metadata, Viewport } from "next";
import { Geologica, Martian_Mono } from "next/font/google";
import "./globals.css";
import { PwaMount } from "@/components/pwa/pwa-mount";
import { HOME_META } from "@/content/home/copy";
import { BACKGROUND_HEX, BRAND_HEX } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

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

const ICON_VERSION = "v2";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "NEWMA",
  description: HOME_META.defaultDescription.text,
  applicationName: "NEWMA",
  appleWebApp: {
    capable: true,
    title: "NEWMA",
    statusBarStyle: "black-translucent",
    startupImage: [{ url: `/brand/apple-touch-icon.png?${ICON_VERSION}` }],
  },
  icons: {
    icon: [
      { url: `/favicon.ico?${ICON_VERSION}`, sizes: "48x48" },
      { url: `/brand/favicon-32.png?${ICON_VERSION}`, sizes: "32x32", type: "image/png" },
      { url: `/brand/favicon-48.png?${ICON_VERSION}`, sizes: "48x48", type: "image/png" },
      { url: `/brand/favicon.svg?${ICON_VERSION}`, type: "image/svg+xml" },
    ],
    apple: [{ url: `/brand/apple-touch-icon.png?${ICON_VERSION}`, sizes: "180x180" }],
    shortcut: `/favicon.ico?${ICON_VERSION}`,
    other: [{ rel: "mask-icon", url: "/brand/safari-pinned-tab.svg", color: "#0b404d" }],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BACKGROUND_HEX },
    { media: "(prefers-color-scheme: dark)", color: BRAND_HEX.foreground },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${geologica.variable} ${martian.variable}`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only top-0 left-0 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        {children}
        <PwaMount />
      </body>
    </html>
  );
}
