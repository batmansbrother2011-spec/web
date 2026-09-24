import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Globe, ShieldCheck, Cookie, Code } from "lucide-react";

export const metadata = {
  title: "About — Vercel Web Proxy",
  description:
    "Learn how this self-hostable web proxy works, what it's good for, what its limitations are, and how to deploy your own copy on Vercel or Cloudflare Workers in under five minutes.",
  keywords: [
    "web proxy",
    "vercel proxy",
    "cloudflare workers proxy",
    "self-hosted proxy",
    "next.js proxy",
    "http proxy",
    "serverless proxy",
    "anonymous browsing",
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
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
          <a
            href="/"
            className="ml-auto text-sm text-primary hover:underline"
          >
            ← Back to proxy
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 flex flex-col gap-8">
        <section>
          <h2 className="text-3xl font-bold tracking-tight">About this proxy</h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Vercel Web Proxy is an open-source, self-hostable HTTP proxy built
            on Next.js 16 and deployed to Vercel or Cloudflare Workers. It
            fetches a target URL server-side, rewrites every link, script,
            stylesheet, and image so the request stays inside the proxy, and
            renders the result in a sandboxed iframe. A per-host cookie jar
            stores upstream session cookies so you can sign into sites and
            stay logged in across navigations. The proxy is designed for
            personal browsing, geo-bypass testing, content research, and
            security reviews — not for circumventing institutional
            acceptable-use policies.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            When you enter a URL into the proxy, the request is sent to the
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">/api/proxy</code>
            serverless route. That route fetches the upstream URL using a
            generic browser User-Agent, strips identifying request headers
            (your real IP, <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">X-Forwarded-*</code>,
            Vercel-internal headers, your cookies), and returns the response.
            For HTML and CSS responses, the proxy rewrites every
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">href</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">src</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">srcset</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">action</code>,
            and <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">url()</code>
            reference so they route back through the proxy. A small inline
            JavaScript shim patches <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">fetch</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">XMLHttpRequest</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">WebSocket</code>,
            and <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">EventSource</code>
            so JavaScript-initiated requests also flow through the proxy.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Header stripping</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                The proxy removes upstream <code className="rounded bg-muted px-1 py-0.5 text-xs">X-Frame-Options</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">Content-Security-Policy: frame-ancestors</code> headers so proxied pages can render inside the iframe. <code className="rounded bg-muted px-1 py-0.5 text-xs">Cross-Origin-Opener-Policy</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">Cross-Origin-Embedder-Policy</code> are also stripped so the proxied page can fetch its subresources normally.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cookie className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Cookie jar</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Because serverless functions are stateless, upstream cookies are bundled into a single <code className="rounded bg-muted px-1 py-0.5 text-xs">HttpOnly</code> cookie on our domain. The proxy reads this jar on every request, replays the relevant cookies to the upstream server, and writes any <code className="rounded bg-muted px-1 py-0.5 text-xs">Set-Cookie</code> response back into the jar.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Code className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Open source</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                The full source code is in the project ZIP, downloadable from the home page. Read it before deploying — you should understand what a proxy does to your traffic before you trust it with your browsing.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Edge runtime</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                The proxy route runs on Node.js but uses only Web-standard APIs (<code className="rounded bg-muted px-1 py-0.5 text-xs">fetch</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">Headers</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">URL</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">Response</code>) so the same code deploys to Vercel, Cloudflare Workers, Deno Deploy, or any other Web-standards host.
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">
            What it&apos;s good for
          </h2>
          <ul className="mt-3 space-y-2 text-base text-muted-foreground">
            <li>• Browsing the web from a different IP address without installing a VPN</li>
            <li>• Testing how a website renders in different regions or with different cookies</li>
            <li>• Signing into a site you don&apos;t trust with your real session, using a throwaway browser profile</li>
            <li>• Researching content that&apos;s geo-restricted in your country</li>
            <li>• Reviewing the markup, scripts, and network requests of a site without exposing your real IP</li>
            <li>• Learning how HTTP proxies, cookie jars, and URL rewriting work — the source code is fully commented</li>
          </ul>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">
            What it does NOT do
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The proxy only handles HTTP and HTTPS traffic. It cannot carry
            UDP traffic, which means it cannot proxy WebRTC video streams,
            online games, or any protocol that rides on UDP. Specifically:
          </p>
          <ul className="mt-3 space-y-2 text-base text-muted-foreground">
            <li>• <strong>Xbox Cloud Gaming, GeForce NOW, PlayStation Remote Play, Amazon Luna</strong> — the launcher pages load, but the actual game stream uses WebRTC over UDP and cannot be proxied at the HTTP layer. Use a real VPN for these.</li>
            <li>• <strong>TikTok</strong> — TikTok&apos;s anti-bot system detects proxy traffic and shows a CAPTCHA. There is no way around this from an HTTP proxy.</li>
            <li>• <strong>Google login, banking sites, some e-commerce checkouts</strong> — these sites use client-side checks that detect proxy environments (unusual <code className="rounded bg-muted px-1 py-0.5 text-xs">window.location</code>, mismatched TLS fingerprints, etc.) and refuse to load.</li>
            <li>• <strong>Anything requiring WebSockets over a non-HTTP port</strong> — the proxy can carry WebSocket traffic but only on standard HTTPS ports.</li>
          </ul>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">
            Security &amp; privacy notes
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The proxy is sandboxed to prevent proxied pages from accessing
            your real browser session, but sandboxing is not a hard security
            boundary. Hostile pages can still execute JavaScript, attempt
            clickjacking, fingerprint your browser, and try to escape the
            iframe. Do not log into sensitive accounts (your bank, your
            primary email, your work account) through this proxy. Use a
            separate, throwaway browser profile, ideally deployed to a
            separate Vercel project you control.
          </p>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The proxy does not anonymize you against the operator of the
            proxy. If you host it on Vercel, Vercel sees the upstream IPs
            you&apos;re requesting and the volume of traffic. If you host it
            on Cloudflare Workers, Cloudflare sees the same. The cookie jar
            is stored in your browser, not on the server, so it&apos;s
            scoped to your device.
          </p>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            POST, PUT, and other body-bearing requests are forwarded with
            the original body intact. Don&apos;t deploy this proxy publicly
            without rate-limiting or authentication, or people will use it
            to launder automated requests through your Vercel account.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">
            Deploy your own copy
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The full project ZIP is downloadable from the home page — look
            for the &quot;Download .zip&quot; button in the header. Unzip
            it, push it to a new GitHub repo, then import that repo at{" "}
            <a
              href="https://vercel.com/new"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              vercel.com/new
            </a>{" "}
            or follow the Cloudflare Workers instructions in the README.
            The whole process takes about five minutes from download to
            live URL, and the free tier of either platform is enough for
            personal use.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">License</h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            MIT. Use it, fork it, sell it, learn from it. No warranty, no
            liability. If you deploy it publicly and people abuse it,
            that&apos;s on you.
          </p>
        </section>
      </main>

      <footer className="border-t mt-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
          <span>Built with Next.js 16 · MIT license</span>
          <a
            href="/"
            className="ml-auto hover:text-foreground hover:underline underline-offset-2"
          >
            ← Back to proxy
          </a>
        </div>
      </footer>
    </div>
  );
}
