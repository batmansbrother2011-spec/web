# Vercel Web Proxy

A minimal, self-hostable **web proxy** built on Next.js 16 App Router. Deploy to Vercel in one click.

## What it does

- Paste a URL → the page loads through `/api/proxy?url=…` (a Next.js serverless route).
- HTML and CSS responses are rewritten so every `href`, `src`, `srcset`, `action`, `url()` and `@import` continues to flow through the proxy.
- A small inline shim rewrites `fetch()` / `XMLHttpRequest` / `navigator.sendBeacon` so JS-initiated requests from the proxied page stay inside the proxy too.
- **Per-host cookie jar:** upstream `Set-Cookie` headers are captured and replayed on subsequent requests, so you can actually **sign into sites** through the proxy and stay logged in.
- Outgoing request headers are sanitized: cookies, `X-Forwarded-*`, Vercel-internal headers, and your real `Host` are stripped before fetching the target. A generic browser User-Agent is used so the target site doesn't 403 on principle.
- The UI keeps a local browser history (last 12 URLs, `localStorage`) and shows a badge of which sites have cookies stored.

## Project layout

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | UI: URL bar, examples, history, cookie status, iframe result, "how it works" card. |
| `src/app/api/proxy/route.ts` | The proxy endpoint. Fetches the target, rewrites HTML/CSS, captures `Set-Cookie`, streams everything else through. |
| `src/app/api/proxy/cookies/route.ts` | Cookie-jar inspection endpoint. `GET` → list of hostnames; `DELETE` → wipe the jar. |
| `src/lib/proxy.ts` | URL-rewriting helpers (HTML, CSS, srcset, meta-refresh, inline styles) + cookie-jar helpers. |
| `vercel.json` | Marks `/api/proxy` for `maxDuration=60` so the route doesn't time out on slow sites. |
| `src/components/theme-provider.tsx` | Light/dark theme wrapper (used by Sonner toasts). |

## Run locally

```bash
bun install
bun run dev
# open the Preview panel — do NOT visit localhost directly
```

## Deploy to Vercel

1. Push this folder to a new GitHub repo.
2. Go to <https://vercel.com/new> and import the repo.
3. Framework preset is **Next.js**. No env vars are required.
4. Click **Deploy**.

The `vercel.json` included bumps the proxy route's `maxDuration` to 60s.
Vercel Hobby caps serverless functions at 10s — if you're on Hobby, large /
slow pages may still time out; either upgrade to Pro or proxy smaller pages.

## How the cookie jar works

Vercel serverless functions are stateless, so a server-side session cookie jar wouldn't persist between requests. Instead, we bundle all upstream cookies into a single `proxy_cookies` cookie on **our** domain:

1. Browser sends our `proxy_cookies` cookie on every request to `/api/proxy` (the cookie has `Path=/api/proxy`, so it doesn't leak to `/` or static assets).
2. The proxy deserializes the jar, looks up cookies for the target hostname, and sends them as the outgoing `Cookie:` header.
3. Any `Set-Cookie` from the upstream response is parsed (name=value, honoring deletion semantics) and merged back into the jar.
4. The updated jar is sent back as a `Set-Cookie` on the proxied response, with `HttpOnly` + `SameSite=Lax` so:
   - Proxied JavaScript can't read it (no XSS exfiltration).
   - Top-level navigations to the proxy still work.

**Limits:**
- The jar lives in a single browser cookie, so it's capped at ~4 KB. Most login flows fit easily; if you outgrow this, the next step is chunking into `proxy_cookies_0`, `proxy_cookies_1`, etc.
- Only the proxied browser tab sees the cookies — the jar is scoped to the proxy origin, not shared with the real upstream site.

## Security notes (please read)

- The proxied page is rendered in a sandboxed iframe. JS is allowed (so the page actually works), but the sandbox blocks top-level navigation out of the iframe.
- Sandboxing is not a hard boundary. Hostile pages can still execute JavaScript, attempt clickjacking, fingerprint, etc.
- The cookie jar is `HttpOnly` so proxied JS can't read it, but the jar still travels with every request to `/api/proxy` — if a malicious proxied page tricks you into submitting a form, that form submission will carry the cookies.
- The proxy does not anonymize you against the *operator* of the proxy (i.e., you). If you host it on Vercel, Vercel sees the upstream IP and traffic.
- POST/PUT/etc. are forwarded with the original body. Don't deploy this publicly without rate-limiting or auth, or people will use it to launder requests through your Vercel account.

## Roadmap ideas

- Streaming HTML rewrite (currently buffered, fine for most pages)
- Rate-limit / auth gate for `/api/proxy`
- Option to disable scripts entirely (read-only mode)
- Multi-cookie chunking for jars > 4 KB
