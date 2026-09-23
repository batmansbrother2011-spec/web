---
Task ID: 1
Agent: main (Super Z)
Task: Build a Vercel-deployable web proxy on Next.js 16. Add cookie jar support so users can sign into sites through the proxy. Bundle the project as a downloadable zip.

Work Log:
- Initialized fullstack Next.js 16 project (App Router, TypeScript, shadcn/ui).
- Built `/api/proxy` route that fetches a target URL and rewrites HTML/CSS so every href / src / srcset / action / url() / @import / meta-refresh / inline-style flows back through the proxy.
- Injected a tiny JS shim into proxied HTML so JS-initiated fetch / XHR / sendBeacon also route through the proxy. Fixed shim to resolve relative URLs against the upstream TARGET (was previously resolving against our own origin → 404s).
- Added a per-host cookie jar in `src/lib/proxy.ts`. Vercel serverless is stateless, so all upstream cookies are bundled into a single `proxy_cookies` HttpOnly + SameSite=Lax + Path=/api/proxy cookie on our own domain.
- Updated `/api/proxy/route.ts` to:
  - Read the jar from the incoming request.
  - Forward cookies for the target host as the upstream `Cookie:` header.
  - Follow redirects MANUALLY (up to 8 hops) so Set-Cookie from intermediate 3xx responses is captured (a common login-flow pattern: POST /login → 302 Set-Cookie → 200 /dashboard).
  - Write the updated jar back as Set-Cookie on the response.
- Added `/api/proxy/cookies` route:
  - GET → list of hostnames with cookie counts (values never exposed).
  - DELETE → clears the jar (Set-Cookie with Max-Age=0).
- Updated `src/app/page.tsx` UI: "Logged-in sites" card showing per-host cookie counts, "Clear" button for cookies, header badge showing "N sites logged in".
- Added `vercel.json` bumping `/api/proxy` to `maxDuration=60`.
- Updated README with full cookie-jar explanation + security notes.

Stage Summary:
- Lint: clean (0 errors, 0 warnings).
- Agent Browser verified: example.com loads through proxy, links rewritten correctly, login-flow test with httpbin.org captured session cookie via 302 redirect, jar replays cookie on subsequent requests, multiple cookies merge per host, DELETE clears the jar, UI badge updates.
- Output: `/home/z/my-project/download/web-proxy.zip` (176 KB) — contains only what's needed to deploy (src/, public/, prisma/, package.json, bun.lock, configs, vercel.json, README.md). node_modules / .next / .git / sandbox internals excluded.
