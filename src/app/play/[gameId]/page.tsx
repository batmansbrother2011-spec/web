import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gamepad2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [
    { gameId: "retro-bowl" },
    { gameId: "2048" },
    { gameId: "polytrack" },
  ];
}

interface GameConfig {
  title: string;
  url: string;
  description: string;
  /**
   * If true, route the iframe through our /api/proxy endpoint so we can
   * strip X-Frame-Options and CSP frame-ancestors headers. Required for
   * sites that explicitly block embedding (like Kodub's Polytrack).
   */
  useProxy?: boolean;
}

const GAMES: Record<string, GameConfig> = {
  "retro-bowl": {
    title: "Retro Bowl",
    url: "https://poki.com/en/g/retro-bowl",
    description:
      "The classic American football game. Build your dynasty, draft players, manage morale, and chase the championship.",
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
      "A low-poly racing game with loops, jumps, and high speeds. Race against the clock on customizable tracks. Version 0.6.2 — the latest stable release from Kodub.",
    // Kodub's CSP blocks iframe embedding from non-kodub domains. Route
    // through our /api/proxy so we strip the CSP header and can embed it.
    useProxy: true,
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
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; microphone"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-modals allow-downloads"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      </div>
    </div>
  );
}
