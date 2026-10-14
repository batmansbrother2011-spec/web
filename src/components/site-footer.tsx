import Link from "next/link";
import { Globe } from "lucide-react";

/**
 * Shared footer used on all pages (home, about, faq, privacy, terms).
 *
 * Designed to be prominent enough that AdSense reviewers can clearly see
 * site navigation links — they specifically look at the footer for
 * Privacy Policy, Terms, About links when evaluating "navigation quality".
 */
export function SiteFooter() {
  return (
    <footer className="border-t mt-auto bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold">Vercel Web Proxy</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Self-hosted, serverless HTTP proxy built on Next.js 16.
              Deploy to Vercel or Cloudflare Workers in one click.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Site</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/play"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Play Games
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="/web-proxy.zip"
                  download="web-proxy.zip"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Download source
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Deploy on Vercel
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com/docs/functions/serverless-functions"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Vercel docs →
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Legal</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Built with Next.js 16 · MIT license. Use at your own risk.
              Don&apos;t log into sensitive accounts through this proxy.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t text-xs text-muted-foreground flex flex-wrap items-center gap-2">
          <span>© {new Date().getFullYear()} Vercel Web Proxy</span>
          <span className="ml-auto">MIT License · No warranty</span>
        </div>
      </div>
    </footer>
  );
}
