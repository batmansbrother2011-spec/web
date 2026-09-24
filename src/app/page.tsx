"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Copy,
  Cookie,
  Download,
  ExternalLink,
  Globe,
  History,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { AdUnit } from "@/components/ad-unit";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectsSection } from "@/components/projects-section";

interface HistoryItem {
  url: string;
  ts: number;
}

const HISTORY_KEY = "proxy.history.v1";
const MAX_HISTORY = 12;

export default function Home() {
  const [input, setInput] = useState("");
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const [cookieHosts, setCookieHosts] = useState<
    Array<{ host: string; count: number }>
  >([]);

  // Load history once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Refresh the cookie host list. Called on mount and after each proxy
  // navigation, because the iframe's load may have triggered a Set-Cookie
  // from upstream that updated our server-side jar cookie.
  const refreshCookies = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/cookies", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        hosts: Array<{ host: string; count: number }>;
      };
      setCookieHosts(data.hosts || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshCookies();
  }, [refreshCookies]);

  const persistHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, []);

  const normalizedInput = useMemo(() => {
    const v = input.trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
  }, [input]);

  const proxyUrl = useMemo(() => {
    if (!activeTarget) return null;
    return `/api/proxy?url=${encodeURIComponent(activeTarget)}`;
  }, [activeTarget]);

  const absoluteProxyUrl = useMemo(() => {
    if (!activeTarget) return null;
    if (typeof window === "undefined") return null;
    return `${window.location.origin}/api/proxy?url=${encodeURIComponent(activeTarget)}`;
  }, [activeTarget]);

  const go = useCallback(
    (raw: string) => {
      const target = raw.trim();
      if (!target) {
        toast.error("Please enter a URL first");
        return;
      }
      let url: URL;
      try {
        url = new URL(
          /^https?:\/\//i.test(target) ? target : `https://${target}`,
        );
      } catch {
        toast.error("That doesn't look like a valid URL");
        return;
      }
      if (!/^https?:$/.test(url.protocol)) {
        toast.error("Only http: and https: URLs are supported");
        return;
      }
      setLoading(true);
      setActiveTarget(url.toString());
      setIframeKey((k) => k + 1);

      // Update history (most-recent first, dedup by URL).
      const next: HistoryItem[] = [
        { url: url.toString(), ts: Date.now() },
        ...history.filter((h) => h.url !== url.toString()),
      ].slice(0, MAX_HISTORY);
      persistHistory(next);
    },
    [history, persistHistory],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    go(normalizedInput);
  };

  const onIframeLoad = () => {
    setLoading(false);
    // Give the server a moment to settle Set-Cookie, then refresh the
    // host list so the "logged in to N sites" badge updates.
    setTimeout(() => void refreshCookies(), 250);
  };

  const copyProxyUrl = async () => {
    if (!absoluteProxyUrl) return;
    try {
      await navigator.clipboard.writeText(absoluteProxyUrl);
      toast.success("Proxy URL copied");
    } catch {
      toast.error("Couldn't copy — select & copy manually");
    }
  };

  const clearHistory = () => {
    persistHistory([]);
    toast.success("History cleared");
  };

  const clearCookies = async () => {
    try {
      const res = await fetch("/api/proxy/cookies", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCookieHosts([]);
      toast.success("Cookie jar cleared — logged-out sessions wiped");
    } catch {
      toast.error("Couldn't clear cookies");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster richColors closeButton position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Globe className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight">
              Vercel Web Proxy
            </span>
            <span className="text-xs text-muted-foreground leading-tight">
              Self-hosted, serverless, deploy to Vercel in one click
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {cookieHosts.length > 0 && (
              <Badge variant="secondary" className="gap-1.5">
                <Cookie className="h-3.5 w-3.5" />
                {cookieHosts.length} site
                {cookieHosts.length === 1 ? "" : "s"} logged in
              </Badge>
            )}
            <ThemeToggle />
            <a
              href="/web-proxy.zip"
              download="web-proxy.zip"
              className="inline-flex"
            >
              <Badge variant="default" className="gap-1.5 cursor-pointer">
                <Download className="h-3.5 w-3.5" /> Download .zip
              </Badge>
            </a>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex"
            >
              <Badge variant="secondary" className="gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Serverless
              </Badge>
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Hero / URL bar + sidebar ad */}
        <section className="space-y-3">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Enter a URL to proxy</CardTitle>
                <p className="text-sm text-muted-foreground">
                  The page is fetched server-side by the{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    /api/proxy
                  </code>{" "}
                  route and rewritten so all links, scripts, styles, and images
                  stay inside the proxy.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="example.com    or    https://news.ycombinator.com"
                    inputMode="url"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button type="submit" disabled={loading} className="gap-1.5">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Proxy
                  </Button>
                </form>

                {/* Quick examples */}
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <span className="text-muted-foreground self-center mr-1">
                    Try:
                  </span>
                  {[
                    "https://example.com",
                    "https://news.ycombinator.com",
                    "https://en.wikipedia.org/wiki/Proxy_server",
                  ].map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        setInput(u);
                        go(u);
                      }}
                      className="rounded-full border bg-muted/40 hover:bg-muted px-2.5 py-1 transition-colors"
                    >
                      {u.replace(/^https?:\/\//, "")}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Small ad panel #1 — only visible on lg+ where it has a sidebar slot */}
            <div className="hidden lg:flex">
              <AdUnit
                slot="1111111111"
                className="w-full"
                label="Sponsored"
              />
            </div>
          </div>
        </section>

        {/* More projects */}
        <ProjectsSection />

        {/* Result */}
        {activeTarget && (
          <section className="space-y-3">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Proxied URL
                  </CardTitle>
                  <code className="rounded bg-muted px-2 py-1 text-xs break-all">
                    {activeTarget}
                  </code>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyProxyUrl}
                      className="gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy proxy URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="gap-1.5"
                    >
                      <a href={proxyUrl ?? "#"} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setActiveTarget(null);
                        setInput("");
                      }}
                      className="gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" /> Close
                    </Button>
                  </div>
                </div>
                {/* Streaming / WebRTC warning banner — only shown for sites
                    known to use game streaming or video calls. */}
                {isStreamingSite(activeTarget) && (
                  <div className="mt-3 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
                    <strong>WebRTC / streaming site:</strong>{" "}
                    The proxy injects a TURN relay server into the proxied
                    page&apos;s WebRTC config so the stream flows through a
                    relay instead of dying on direct UDP. The default relay
                    is Open Relay (openrelay.metered.ca, 500 MB/month free)
                    — set <code className="rounded bg-muted px-1 py-0.5 text-xs">TURN_URLS</code> + <code className="rounded bg-muted px-1 py-0.5 text-xs">TURN_USERNAME</code> + <code className="rounded bg-muted px-1 py-0.5 text-xs">TURN_CREDENTIAL</code> env vars to swap in your own
                    coturn server for unlimited traffic.
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-[68vh] min-h-[420px] w-full overflow-hidden rounded-b-lg border-t bg-muted/30">
                  {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Fetching through proxy…
                      </p>
                    </div>
                  )}
                  <iframe
                    key={iframeKey}
                    src={proxyUrl ?? undefined}
                    onLoad={onIframeLoad}
                    className="h-full w-full"
                    title="Proxied content"
                    // `allow-top-navigation-by-user-activation` lets links the
                    // user clicks inside the iframe navigate the iframe itself,
                    // so clicking a search result on google.com goes through
                    // the proxy instead of being silently blocked.
                    //
                    // We deliberately do NOT add `allow-top-navigation` (which
                    // would let scripts auto-redirect the parent window).
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                    referrerPolicy="no-referrer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Cookies + History + Info + Sidebar ad */}
        <section className="grid gap-6 md:grid-cols-[1fr_1fr_280px] lg:grid-cols-[1fr_1fr_280px_300px]">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Cookie className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Logged-in sites
              </CardTitle>
              {cookieHosts.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearCookies}
                  className="ml-auto h-7 gap-1.5 text-xs text-muted-foreground"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {cookieHosts.length === 0 ? (
                <div className="px-6 pb-6 text-sm text-muted-foreground">
                  No sites have set cookies yet. Sign in to a site through the
                  proxy and its session cookies will be stored here so you stay
                  logged in across navigations.
                </div>
              ) : (
                <ScrollArea className="max-h-72">
                  <ul className="divide-y">
                    {cookieHosts.map((c) => (
                      <li
                        key={c.host}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/40 cursor-pointer"
                        onClick={() => {
                          const u = `https://${c.host}`;
                          setInput(u);
                          go(u);
                        }}
                      >
                        <Cookie className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-mono text-xs">
                          {c.host}
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-auto shrink-0 text-[10px]"
                        >
                          {c.count} cookie{c.count === 1 ? "" : "s"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">History</CardTitle>
              {history.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearHistory}
                  className="ml-auto h-7 gap-1.5 text-xs text-muted-foreground"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="px-6 pb-6 text-sm text-muted-foreground">
                  Your recently proxied URLs will show up here. Stored locally
                  in your browser — nothing leaves this device.
                </div>
              ) : (
                <ScrollArea className="max-h-72">
                  <ul className="divide-y">
                    {history.map((h) => (
                      <li
                        key={h.url + h.ts}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/40 cursor-pointer"
                        onClick={() => {
                          setInput(h.url);
                          go(h.url);
                        }}
                      >
                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-mono text-xs">
                          {h.url}
                        </span>
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                          {formatRelative(h.ts)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Requests go to{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  /api/proxy?url=…
                </code>{" "}
                — a Next.js route running on Vercel&apos;s serverless runtime.
              </p>
              <Separator />
              <p>
                HTML and CSS responses are rewritten so every{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  href
                </code>{" "}
                /{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  src
                </code>{" "}
                /{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  url()
                </code>{" "}
                continues to flow through the proxy.
              </p>
              <Separator />
              <p>
                Upstream cookies are captured into a per-host cookie jar stored
                in a single <code className="rounded bg-muted px-1 py-0.5 text-xs">HttpOnly</code> cookie on
                this domain. You can sign into sites through the proxy and stay
                logged in across navigations.
              </p>
              <Separator />
              <p>
                Your real IP is never forwarded, and the outgoing request uses
                a generic browser User-Agent.
              </p>
              <Separator />
              <p className="text-xs">
                Hostile sites can still execute JavaScript — the sandbox
                restricts but doesn&apos;t fully isolate. Use a separate,
                throwaway Vercel deployment for sensitive logins.
              </p>
            </CardContent>
          </Card>

          {/* Small ad panel #2 — sidebar slot on lg+; sits below the Info
              card on md screens. Hidden on small mobile to avoid clutter. */}
          <div className="hidden lg:flex">
            <AdUnit
              slot="2222222222"
              className="w-full"
              label="Sponsored"
            />
          </div>
        </section>
      </main>

      {/* Big download section near the bottom of the page */}
      <section className="mx-auto max-w-6xl w-full px-4 sm:px-6 pb-8">
        <Card className="border-border/60 bg-primary/5">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Download className="h-6 w-6" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-base font-semibold">
                Download the source code
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Grab the full project as a zip — deploy to Vercel or Cloudflare
                Workers (instructions in README.md).
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <a href="/web-proxy.zip" download="web-proxy.zip">
                <Download className="h-4 w-4" />
                Download .zip (~236 KB)
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/**
 * Returns true for sites known to use WebRTC for game streaming or
 * real-time video. We surface a warning banner for these so users know
 * the actual stream won't work through an HTTP proxy.
 */
function isStreamingSite(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return [
      "xbox.com",
      "www.xbox.com",
      "geforcenow.com",
      "play.geforcenow.com",
      "stadia.google.com",
      "stadia.com",
      "playstation.com",
      "remoteplay.dl.playstation.net",
      "luna.amazon.com",
      "rainway.com",
      "parsecgaming.com",
      "stadiagamedev.com",
      "cloudcast.gg",
      "gamepass.com",
      "discord.com",
      "meet.google.com",
      "zoom.us",
      "teams.microsoft.com",
      "web.skype.com",
      "twitch.tv",
      "youtube.com",
    ].some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}
