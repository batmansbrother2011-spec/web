import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vercel Web Proxy — self-hostable serverless proxy",
  description:
    "A minimal, self-hostable web proxy built on Next.js 16 serverless routes. Deploy to Vercel in one click.",
  keywords: [
    "web proxy",
    "vercel",
    "next.js",
    "serverless",
    "self-host",
    "anonymizing proxy",
  ],
  authors: [{ name: "you" }],
};

/**
 * Google AdSense publisher client ID.
 *
 * Replace the placeholder below with your own AdSense publisher ID
 * (looks like `ca-pub-1234567890123456`), OR set the
 * `NEXT_PUBLIC_ADSENSE_CLIENT` environment variable in Vercel to override it
 * without touching this file.
 *
 * Until you set a real ID, ad slots will render as small "Sponsored —
 * placeholder" panels so the layout doesn't break.
 */
const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-0000000000000000";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster />

        {/* Google AdSense loader.
            Loaded with strategy="afterInteractive" so it never blocks
            the page from becoming interactive. */}
        {ADSENSE_CLIENT && ADSENSE_CLIENT !== "ca-pub-0000000000000000" && (
          <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
