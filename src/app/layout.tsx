import type { Metadata, Viewport } from "next";
import "./globals.css";
import { HOME_META } from "@/content/home/copy";
import { BACKGROUND_HEX } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "NEWMA",
  description: HOME_META.defaultDescription.text,
};

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
        {children}
      </body>
    </html>
  );
}
