import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gamepad2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

// Render dynamically so any game ID works without needing to pre-render
// every route at build time. This fixes 404s when adding new games.
export const dynamic = "force-dynamic";

interface GameConfig {
  title: string;
  url: string;
  description: string;
  /**
   * If true, route the iframe through our /api/proxy endpoint so we can
   * strip X-Frame-Options and CSP frame-ancestors headers. Required for
   * sites that explicitly block embedding (like Kodub's Polytrack,
   * Poki, or 1v1.lol).
   */
  useProxy?: boolean;
  /** Optional badge shown in the header (e.g. "Multiplayer"). */
  badge?: string;
}

const GAMES: Record<string, GameConfig> = {
  "retro-bowl": {
    title: "Retro Bowl",
    url: "https://poki.com/en/g/retro-bowl",
    description:
      "The classic American football game. Build your dynasty, draft players, manage morale, and chase the championship.",
    useProxy: true, // Poki blocks iframe embedding via CSP
  },
  "2048": {
    title: "2048",
    url: "https://play2048.co",
    description:
      "The classic sliding tile puzzle. Combine matching numbers to reach 2048.",
  },
  polytrack: {
    title: "Polytrack",
    // Kodub's static hosting serves v0.6.2 — the latest stable release.
    url: "https://app-polytrack.kodub.com/0.6.2/",
    description:
      "A low-poly racing game with loops, jumps, and high speeds. Race against the clock on customizable tracks. Every millisecond counts. Version 0.6.2 — the latest stable release from Kodub.",
    // Kodub's CSP blocks iframe embedding from non-kodub domains. Route
    // through our /api/proxy so we strip the CSP header and can embed it.
    useProxy: true,
  },
  "run-3": {
    title: "Run 3",
    url: "https://games.crazygames.com/en_US/run-3/index.html",
    description:
      "The classic endless runner. Jump, dodge, and gravity-flip your way through tunnels in space. Simple controls, addicting gameplay — a Flash-game-era classic reborn.",
  },
  krunker: {
    title: "Krunker.io",
    url: "https://krunker.io",
    description:
      "Fast-paced multiplayer first-person shooter. Blocky graphics, smooth gameplay, instant matchmaking. The most popular browser FPS — thousands of players online at any time.",
    badge: "Multiplayer",
  },
  "1v1-lol": {
    title: "1v1.LOL",
    url: "https://1v1.lol",
    description:
      "Build, shoot, and outplay opponents in 1v1, 2v2, and battle royale modes. Fortnite-style building mechanics in your browser. Real-time multiplayer against other players worldwide.",
    // Note: 1v1.lol uses Cloudflare bot protection that blocks our proxy.
    // The /play page links out to it directly instead of embedding.
    // This entry exists only for SEO/metadata if someone hits /play/1v1-lol directly.
    useProxy: false,
    badge: "Multiplayer",
  },
  shellshockers: {
    title: "Shell Shockers",
    url: "https://shellshock.io",
    description:
      "Multiplayer egg-based shooter. Crack opponents, collect weapons, dominate the arena. The most ridiculous multiplayer FPS — surprisingly competitive and tons of fun.",
    badge: "Multiplayer",
  },
};

export function generateMetadata({ params }: { params: { gameId: string } }) {
  const game = GAMES[params.gameId];
  if (!game) return { title: "Game not found" };
  return {
    title: `${game.title} — Play Games`,
    description: game.description,
  };
}

export default function GamePage({ params }: { params: { gameId: string } }) {
  const game = GAMES[params.gameId];
  if (!game) notFound();

  // If the game blocks iframe embedding, route through our /api/proxy
  // endpoint which strips X-Frame-Options and CSP frame-ancestors headers.
  const iframeSrc = game.useProxy
    ? `/api/proxy?url=${encodeURIComponent(game.url)}`
    : game.url;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Compact header — minimal so the game gets maximum space */}
      <header className="border-b bg-background/80 backdrop-blur shrink-0">
        <div className="px-4 py-2 flex items-center gap-3">
          <Link
            href="/play"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All games
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-sm font-semibold inline-flex items-center gap-1.5">
            <Gamepad2 className="h-3.5 w-3.5" />
            {game.title}
          </h1>
          {game.useProxy && (
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
              proxied
            </span>
          )}
          {game.badge && (
            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {game.badge}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="ghost" className="h-7 gap-1.5 text-xs">
              <a
                href={game.url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
                Open original
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Game iframe — fills the rest of the screen */}
      <div className="flex-1 relative">
        <iframe
          src={iframeSrc}
          className="absolute inset-0 w-full h-full border-0"
          title={game.title}
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; microphone; camera; cross-origin-isolated"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-modals allow-downloads allow-storage-access-by-user-activation"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      </div>
    </div>
  );
}
