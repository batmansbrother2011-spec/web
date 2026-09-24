import Link from "next/link";
import { Globe } from "lucide-react";

/**
 * Simple header for static content pages (about, faq, privacy, terms).
 * Smaller than the home page header — just the logo + back link.
 */
export function SiteHeader() {
  return (
    <header className="border-b sticky top-0 z-30 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">
            Vercel Web Proxy
          </h1>
          <p className="text-xs text-muted-foreground leading-tight">
            Self-hosted, serverless, deploy in one click
          </p>
        </div>
        <Link
          href="/"
          className="ml-auto text-sm text-primary hover:underline"
        >
          ← Back to proxy
        </Link>
      </div>
    </header>
  );
}
