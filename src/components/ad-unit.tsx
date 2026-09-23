"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-0000000000000000";

const IS_PLACEHOLDER = ADSENSE_CLIENT === "ca-pub-0000000000000000";

interface AdUnitProps {
  /** Ad slot ID from your AdSense dashboard (e.g. "1234567890"). */
  slot?: string;
  /**
   * Ad format. Defaults to "auto" which lets AdSense pick the best size.
   * You can also pass a fixed size like `"300x250"`.
   */
  format?: string;
  /** Whether the ad should be responsive. Defaults to true. */
  responsive?: boolean;
  /** Optional className for the outer wrapper. */
  className?: string;
  /** Optional label shown above the ad (defaults to "Sponsored"). */
  label?: string;
}

/**
 * Google AdSense ad unit.
 *
 * Renders an `<ins class="adsbygoogle">` element and pushes the
 * initialization command to the `adsbygoogle` queue once mounted.
 *
 * If no real AdSense publisher ID is configured (the env var
 * NEXT_PUBLIC_ADSENSE_CLIENT is unset and the placeholder is still in
 * place), this component renders a small gray placeholder card so the
 * layout still looks correct while you're developing locally.
 */
export function AdUnit({
  slot = "0000000000",
  format = "auto",
  responsive = true,
  className,
  label = "Sponsored",
}: AdUnitProps) {
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (IS_PLACEHOLDER) return;
    if (!insRef.current) return;
    try {
      // @ts-expect-error -- adsbygoogle is injected by the external script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script hasn't loaded yet — the next push cycle will retry.
    }
  }, [slot]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {label}
        </span>
      )}
      <div className="overflow-hidden rounded-lg border border-dashed border-border/60 bg-muted/20">
        {IS_PLACEHOLDER ? (
          // Render a small placeholder so the layout is visible during
          // development / before the user wires up a real AdSense ID.
          <div
            className="flex h-[120px] w-full items-center justify-center text-center text-[11px] text-muted-foreground/60 px-3"
            aria-label="Ad slot (configure AdSense to fill)"
          >
            Ad slot — set <code className="mx-1 px-1 py-0.5 rounded bg-muted">NEXT_PUBLIC_ADSENSE_CLIENT</code> in Vercel env vars to fill this space
          </div>
        ) : (
          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? "true" : "false"}
          />
        )}
      </div>
    </div>
  );
}
