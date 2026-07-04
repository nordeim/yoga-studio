import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stillwater.yoga"),
  title: {
    default: "Stillwater · A Yoga Studio in Cobble Hill",
    template: "%s · Stillwater",
  },
  description:
    "Slow practice for fast lives. Eight mats to a room, one breath at a time. A boutique yoga studio in Cobble Hill, Brooklyn — Vinyasa, Yin, Restorative, Breathwork. First class free.",
  keywords: [
    "yoga studio",
    "Cobble Hill",
    "Brooklyn",
    "Vinyasa",
    "Yin",
    "Restorative",
    "Breathwork",
    "boutique yoga",
  ],
  authors: [{ name: "Stillwater Studio" }],
  openGraph: {
    title: "Stillwater · A Yoga Studio in Cobble Hill",
    description:
      "Slow practice for fast lives. Eight mats to a room, one breath at a time.",
    url: "https://stillwater.yoga",
    siteName: "Stillwater",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stillwater · A Yoga Studio in Cobble Hill",
    description:
      "Slow practice for fast lives. Eight mats to a room, one breath at a time.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body className="bg-linen-100 text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-linen-50 focus:shadow-lg focus:outline focus:outline-2 focus:outline-terracotta"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
