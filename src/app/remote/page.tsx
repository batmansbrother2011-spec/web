"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Terminal, Globe, Lock, ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const PASSWORD = "a";

export default function RemotePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (passwordInput === PASSWORD) {
        setAuthenticated(true);
        toast.success("Access granted");
      } else {
        toast.error("Wrong password");
      }
      setLoading(false);
    }, 300);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Toaster richColors position="top-center" />
        <Card className="w-full max-w-sm border-border/60">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Remote Desktop Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="text-center"
                autoFocus
              />
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster richColors position="top-center" />
      
      {/* Header */}
      <header className="border-b sticky top-0 z-30 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Remote Desktop</h1>
            <p className="text-xs text-muted-foreground leading-tight">
              Access your Oracle VM desktop from any browser
            </p>
          </div>
          <a href="/" className="ml-auto text-sm text-primary hover:underline">
            ← Back to proxy
          </a>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Connection card */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Connect to Desktop</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to open your Linux desktop in a new tab.
              The desktop runs on your Oracle Cloud VM (129.80.37.229).
            </p>
            <Button asChild size="lg" className="w-full gap-2">
              <a
                href="https://129.80.37.229:8443/vnc.html"
                target="_blank"
                rel="noreferrer"
              >
                <Globe className="h-4 w-4" />
                Open Desktop
                <ExternalLink className="h-4 w-4 ml-auto" />
              </a>
            </Button>
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <strong>Security warning:</strong> You'll see a "certificate not
              valid" warning in your browser. This is normal — the desktop uses
              a self-signed SSL certificate. Tap "Show Details" → "Visit this
              website" to continue.
            </div>
          </CardContent>
        </Card>

        {/* Setup instructions */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">First-time setup (if desktop doesn't load)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              If you get "connection refused" or a timeout when clicking "Open
              Desktop", you need to run the setup script on your Oracle VM
              first. Since you're on an iPad and can't SSH directly, use a
              free web-based SSH client:
            </p>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                <div>
                  <p>Go to a free web SSH terminal:</p>
                  <a href="https://www.serfish.com/ssh/" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    serfish.com/ssh →
                  </a>
                  <p className="mt-1 text-xs">Host: <code className="rounded bg-muted px-1">129.80.37.229</code>, Port: <code className="rounded bg-muted px-1">22</code>, User: <code className="rounded bg-muted px-1">ubuntu</code></p>
                  <p className="mt-1 text-xs text-amber-600">Note: web SSH clients can't use SSH key files. You'll need to have set a password for the ubuntu user on your VM. If you haven't, you need a computer with SSH access to do that first.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                <div>
                  <p>Once logged in via web SSH, paste this command:</p>
                  <code className="block mt-1 rounded bg-muted px-2 py-1 text-xs break-all">curl -fsSL https://raw.githubusercontent.com/batmansbrother2011-spec/web/main/scripts/oracle-vps/setup-novnc-desktop.sh -o setup-novnc-desktop.sh && chmod +x setup-novnc-desktop.sh && sudo bash setup-novnc-desktop.sh</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                <div>
                  <p>Enter a password when prompted, wait 5 minutes, then come back here and click "Open Desktop".</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
                <div>
                  <p>Open port 8443 in Oracle Security List (see SETUP-GUIDE.md for details).</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status checklist */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Setup checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Oracle VM created</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Public IP assigned (129.80.37.229)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>coturn installed (TURN relay for WebRTC)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>noVNC desktop — needs setup (run script on VM)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>Port 8443 TCP open in Oracle Security List</span>
            </div>
          </CardContent>
        </Card>

        {/* What you can do */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">What you can do on the desktop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li>🌐 <strong>Browse from the VM's IP</strong> — open Firefox on the desktop, visit any site. Your real IP is hidden.</li>
              <li>🎮 <strong>Play browser games</strong> — Krunker, Shell Shockers, etc. all work because it's a real browser, not a proxy.</li>
              <li>☁️ <strong>Cloud gaming</strong> — GeForce NOW, Xbox Cloud Gaming work because the VM handles WebRTC directly.</li>
              <li>🔧 <strong>Install software</strong> — open Terminal, run `sudo apt install` to add programs.</li>
              <li>💻 <strong>Full computer</strong> — file manager, terminal, code editors, everything.</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
