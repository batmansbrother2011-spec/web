import { ExternalLink, Gamepad2, Globe, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProjectLink {
  title: string;
  description: string;
  url: string;
  icon: "gamepad" | "globe";
  badge?: string;
}

const PROJECTS: ProjectLink[] = [
  {
    title: "Eaglercraft",
    description:
      "Play Minecraft in your browser — no download required. Full single-player and multiplayer support, runs on any device with a modern browser.",
    // Replace this URL with your actual Eaglercraft site URL
    url: "https://eaglercraft-1-ruddy.vercel.app",
    icon: "gamepad",
    badge: "Play now",
  },
];

export function ProjectsSection() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight">More projects</h2>
        <span className="text-xs text-muted-foreground">
          Other things I&apos;ve built
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project) => {
          const Icon = project.icon === "gamepad" ? Gamepad2 : Globe;
          return (
            <Card
              key={project.title}
              className="border-border/60 hover:border-primary/40 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  {project.badge && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {project.badge}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base mt-2">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
                <Button asChild size="sm" className="w-full gap-1.5">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Visit site
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
