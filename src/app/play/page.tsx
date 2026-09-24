import Link from "next/link";
import { ArrowLeft, Gamepad2, ExternalLink, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Play Games — Vercel Web Proxy",
  description:
    "Free browser games — Retro Bowl, Polytrack, Eaglercraft, and more. No download required.",
  keywords: [
    "free browser games",
    "play retro bowl online",
    "play polytrack online",
    "eaglercraft",
    "minecraft in browser",
    "no download games",
  ],
};

type GameType = "embed" | "link";

interface Game {
  id: string;
  title: string;
  description: string;
  url: string;
  type: GameType;
  category: "sports" | "racing" | "sandbox" | "puzzle";
  badge?: string;
}

const GAMES: Game[] = [
  {
    id: "retro-bowl",
    title: "Retro Bowl",
    description:
      "The classic American football game. Build your dynasty, draft players, manage morale, and chase the championship. Plays in browser, no download.",
    url: "https://poki.com/en/g/retro-bowl",
    type: "embed",
    category: "sports",
    badge: "Most popular",
  },
  {
    id: "polytrack",
    title: "Polytrack",
    description:
      "A low-poly racing game with loops, jumps, and high speeds. Race against the clock on customizable tracks. Every millisecond counts. Version 0.6.2 — the latest stable release from Kodub.",
    // Kodub's CSP blocks iframe embedding, but we route through our own
    // /api/proxy which strips the CSP header, so we can embed it.
    url: "https://app-polytrack.kodub.com/0.6.2/",
    type: "embed",
    category: "racing",
    badge: "v0.6.2",
  },
  {
    id: "eaglercraft",
    title: "Eaglercraft",
    description:
      "Minecraft in your browser. Single-player and multiplayer support, runs on any device with a modern browser. No download required.",
    // Update this URL to your actual Eaglercraft deployment.
    url: "https://your-eaglercraft-site.vercel.app",
    type: "link",
    category: "sandbox",
    badge: "Self-hosted",
  },
  {
    id: "2048",
    title: "2048",
    description:
      "The classic sliding tile puzzle. Combine matching numbers to reach 2048. Easy to learn, hard to master.",
    url: "https://play2048.co",
    type: "embed",
    category: "puzzle",
  },
];

const CATEGORY_LABELS: Record<Game["category"], string> = {
  sports: "Sports",
  racing: "Racing",
  sandbox: "Sandbox",
  puzzle: "Puzzle",
};

export default function PlayPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-30 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Play Games</h1>
            <p className="text-xs text-muted-foreground leading-tight">
              Free browser games — no download required
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm text-primary hover:underline"
            >
              <span className="inline-flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to proxy
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
        <section>
          <h2 className="text-3xl font-bold tracking-tight">Play games</h2>
          <p className="mt-2 text-base text-muted-foreground leading-relaxed">
            Free browser games you can play right now. No downloads, no
            installs, no accounts. Click a game to start playing.
          </p>
        </section>

        {(["sports", "racing", "sandbox", "puzzle"] as Game["category"][]).map((category) => {
          const games = GAMES.filter((g) => g.category === category);
          if (games.length === 0) return null;
          return (
            <section key={category} className="space-y-4">
              <h3 className="text-xl font-semibold tracking-tight">
                {CATEGORY_LABELS[category]}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {games.map((game) => (
                  <Card
                    key={game.id}
                    className="border-border/60 hover:border-primary/40 transition-colors flex flex-col"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Gamepad2 className="h-5 w-5" />
                        </div>
                        {game.badge && (
                          <Badge variant="secondary" className="text-[10px]">
                            {game.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base mt-2">{game.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                        {game.description}
                      </p>
                      <Button asChild size="sm" className="w-full gap-1.5">
                        {game.type === "embed" ? (
                          <Link href={`/play/${game.id}`}>
                            <Play className="h-3.5 w-3.5" />
                            Play now
                          </Link>
                        ) : (
                          <a
                            href={game.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open in new tab
                          </a>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

        <section className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">How this works:</strong>{" "}
          Games marked &quot;Play now&quot; are embedded directly on this
          site. Some game developers (like Kodub for Polytrack) block
          iframe embedding via Content-Security-Policy headers — for those,
          we route the iframe through this site&apos;s own proxy, which
          strips the embedding restrictions. The game still loads from
          the developer&apos;s servers — we don&apos;t host any
          copyrighted game files ourselves. Games marked &quot;Open in
          new tab&quot; open on the developer&apos;s own website.
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
