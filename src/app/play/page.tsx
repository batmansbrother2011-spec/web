import Link from "next/link";
import { ArrowLeft, Gamepad2, ExternalLink, Play, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Play Games — Vercel Web Proxy",
  description:
    "Free browser games hosted directly on this site — 2048, Hextris, Snake. No external dependencies, no embed blocking, no ads.",
  keywords: [
    "free browser games",
    "play 2048 online",
    "play hextris",
    "play snake",
    "self-hosted games",
  ],
};

type GameType = "self-hosted" | "embed" | "link";

interface Game {
  id: string;
  title: string;
  description: string;
  /** For self-hosted games, the local path (e.g. /games/2048/). For embed/link games, the external URL. */
  url: string;
  type: GameType;
  category: "puzzle" | "arcade" | "sports" | "sandbox" | "multiplayer";
  badge?: string;
  /** Optional emoji or icon to show in the card. */
  emoji?: string;
}

const GAMES: Game[] = [
  // ─── Self-hosted games (legal, always work, no embed blocking) ────────
  {
    id: "2048",
    title: "2048",
    description:
      "The classic sliding tile puzzle. Combine matching numbers to reach 2048. Easy to learn, hard to master. Originally by Gabriele Cirulli (MIT licensed).",
    url: "/games/2048/",
    type: "self-hosted",
    category: "puzzle",
    badge: "Self-hosted",
    emoji: "🔢",
  },
  {
    id: "hextris",
    title: "Hextris",
    description:
      "A fast-paced Tetris-inspired puzzle game on a hexagonal grid. Rotate, drop, and clear lines in six directions. Addicting and beautiful. (GPL licensed)",
    url: "/games/hextris/",
    type: "self-hosted",
    category: "puzzle",
    badge: "Self-hosted",
    emoji: "⬡",
  },
  {
    id: "snake",
    title: "Snake",
    description:
      "The classic Nokia game, reborn. Eat the food, grow your snake, don't hit the walls or yourself. Speeds up as you score. Works on desktop and mobile (swipe to play).",
    url: "/games/snake/",
    type: "self-hosted",
    category: "arcade",
    badge: "Self-hosted",
    emoji: "🐍",
  },

  // ─── External embeds (may break due to bot detection — use at own risk) ──
  {
    id: "retro-bowl",
    title: "Retro Bowl",
    description:
      "The classic American football game (embedded from Poki). ⚠️ May not load if Poki blocks the embed — if it shows a blank screen, click 'Open original' instead.",
    url: "https://poki.com/en/g/retro-bowl",
    type: "embed",
    category: "sports",
    badge: "Embed (Poki)",
    emoji: "🏈",
  },

  // ─── External links (open in new tab — always work) ──────────────────
  {
    id: "eaglercraft",
    title: "Eaglercraft",
    description:
      "Minecraft in your browser. Single-player and multiplayer support. Hosted on a separate site (click to open in a new tab).",
    url: "https://your-eaglercraft-site.vercel.app",
    type: "link",
    category: "sandbox",
    badge: "External link",
    emoji: "⛏️",
  },
  {
    id: "polytrack",
    title: "Polytrack",
    description:
      "A low-poly racing game with loops, jumps, and high speeds. Hosted on Kodub's site — we can't embed it reliably due to their bot protection, so this opens in a new tab.",
    url: "https://www.kodub.com/polytrack",
    type: "link",
    category: "arcade",
    badge: "External link",
    emoji: "🏎️",
  },
  {
    id: "krunker",
    title: "Krunker.io",
    description:
      "Fast-paced multiplayer first-person shooter. Blocky graphics, smooth gameplay, instant matchmaking. The most popular browser FPS.",
    url: "https://krunker.io",
    type: "link",
    category: "multiplayer",
    badge: "External link",
    emoji: "🔫",
  },
  {
    id: "shellshockers",
    title: "Shell Shockers",
    description:
      "Multiplayer egg-based shooter. Crack opponents, collect weapons, dominate the arena. Surprisingly competitive and tons of fun.",
    url: "https://shellshock.io",
    type: "link",
    category: "multiplayer",
    badge: "External link",
    emoji: "🥚",
  },
];

const CATEGORY_LABELS: Record<Game["category"], string> = {
  puzzle: "Puzzle",
  arcade: "Arcade",
  sports: "Sports",
  sandbox: "Sandbox",
  multiplayer: "Multiplayer",
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
              Self-hosted games — no embed blocking, no ads, no tracking
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
            Games marked <Badge variant="secondary" className="mx-1 text-[10px]">Self-hosted</Badge>
            are hosted directly on this site — they always work, load instantly,
            and have no ads. Games marked <Badge variant="outline" className="mx-1 text-[10px]">External link</Badge>
            open on the developer&apos;s own website in a new tab (we can&apos;t
            embed them reliably because their bot protection blocks proxies).
          </p>
        </section>

        {(["puzzle", "arcade", "sports", "sandbox", "multiplayer"] as Game["category"][]).map((category) => {
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                          {game.emoji || "🎮"}
                        </div>
                        {game.badge && (
                          <Badge
                            variant={game.type === "self-hosted" ? "secondary" : "outline"}
                            className="text-[10px] gap-1"
                          >
                            {game.type === "self-hosted" && (
                              <ShieldCheck className="h-3 w-3" />
                            )}
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
                        {game.type === "self-hosted" ? (
                          <a href={game.url}>
                            <Play className="h-3.5 w-3.5" />
                            Play now
                          </a>
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
          <strong className="text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Why self-hosted games?
          </strong>{" "}
          Games marked &quot;Self-hosted&quot; are open-source projects (MIT,
          GPL, or Apache licensed) whose source code we host directly on this
          site. They always work — no iframe embedding issues, no bot
          detection, no ads. We don&apos;t host any copyrighted commercial
          game files (like Retro Bowl or Krunker&apos;s source) because that
          would violate the developers&apos; licenses. Commercial games link
          out to the developers&apos; own sites instead.
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
