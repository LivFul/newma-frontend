import type { Metadata, Viewport } from "next";
import { Geist_Mono, Work_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { HOME_META } from "@/content/home/copy";
import { BACKGROUND_HEX, BRAND_HEX } from "@/lib/brand";
import { THEME_INIT_SCRIPT } from "@/lib/theme/init-script";
import { siteUrl } from "@/lib/site";

// Brand pack v1.0 typefaces: Work Sans (headlines, UI, body) and Geist Mono (bylines, labels, data).
const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const ICON_VERSION = "v3";

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
    other: [{ rel: "mask-icon", url: "/brand/safari-pinned-tab.svg", color: BRAND_HEX.night }],
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BACKGROUND_HEX },
    { media: "(prefers-color-scheme: dark)", color: BRAND_HEX.night },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${workSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <Script id="theme-init" strategy="beforeInteractive">
        {THEME_INIT_SCRIPT}
      </Script>
      {/* Extensions such as Grammarly stamp attributes on <body> before hydration; this silences only
          that element's attribute check, never its children. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
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
