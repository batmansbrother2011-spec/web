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
| `src/app/api/proxy/route.ts` | The proxy endpoint. Fetches the target, rewrites HTML/CSS, captures `Set-Cookie`, streams everything else through. Uses `runtime = "edge"` so it works on Cloudflare Workers / Vercel Edge. |
| `src/app/api/proxy/cookies/route.ts` | Cookie-jar inspection endpoint. `GET` → list of hostnames; `DELETE` → wipe the jar. |
| `src/lib/proxy.ts` | URL-rewriting helpers (HTML, CSS, srcset, meta-refresh, inline styles, form actions) + cookie-jar helpers. |
| `vercel.json` | Vercel deployment config (optional — used only if deploying to Vercel). |
| `wrangler.jsonc` | Cloudflare Workers deployment config. |
| `open-next.config.ts` | OpenNext adapter config — tells `@opennextjs/cloudflare` how to build the Worker bundle. |
| `src/components/theme-provider.tsx` | Light/dark theme wrapper (used by Sonner toasts). |
| `src/components/ad-unit.tsx` | Google AdSense ad unit component (renders placeholder if no publisher ID is set). |

## Run locally

```bash
bun install
bun run dev
# open the Preview panel — do NOT visit localhost directly
```

## Deploy to Cloudflare (recommended — free + allows commercial use)

This project is configured to deploy to **Cloudflare Workers** via the OpenNext adapter. The proxy routes use `runtime = "edge"`, so they execute on Cloudflare's V8 runtime — not Node.js — which means:

- ✅ Free tier: 100,000 requests/day, generous bandwidth, global edge network
- ✅ Commercial use allowed (run AdSense without TOS issues)
- ✅ Faster than Vercel for proxying — edge nodes are closer to upstream sites
- ✅ Cookie jar, HTML rewriting, form handling, framebuster neutralizer — all work

### Prerequisites

1. A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
2. Node.js 18+ and `npm` (or `bun`) installed locally.

### One-time setup

```bash
# Clone your repo (or unzip the downloaded zip) and install deps:
npm install

# Log in to Cloudflare from your terminal:
npx wrangler login
# ↳ Opens a browser → click "Allow" → wrangler saves an API token locally

# Optional: set your AdSense publisher ID as a Cloudflare env var.
# Replace with your real ca-pub-XXX, or skip this if not using ads.
npx wrangler secret put NEXT_PUBLIC_ADSENSE_CLIENT
# ↳ Paste your publisher ID when prompted, press Enter.
```

### Build & deploy

```bash
# Build the Next.js app + bundle it for Cloudflare Workers:
npm run deploy:cf
```

This runs:
1. `opennextjs-cloudflare build` — compiles Next.js into a Worker bundle (`.open-next/worker.js`)
2. `wrangler deploy` — uploads the bundle to Cloudflare's edge network

When it finishes, wrangler prints a URL like:
```
https://web-proxy.<your-subdomain>.workers.dev
```

That URL is live on Cloudflare's global edge. Visit it and the proxy works immediately.

### Test locally before deploying

```bash
npm run preview:cf
```

Runs Cloudflare's local emulator (Miniflare) on `http://localhost:8787` — exact same runtime as production, so you can verify the proxy works before each deploy.

### Optional: custom domain

1. Cloudflare dashboard → **Workers & Pages** → your `web-proxy` worker → **Settings → Triggers → Custom Domains**.
2. Click **Add Custom Domain** → enter `proxy.yourdomain.com`.
3. If the domain isn't already on Cloudflare, you'll need to add it (Dashboard → **Add a Site**) and update your registrar's nameservers to Cloudflare's.
4. SSL is issued automatically within ~60 seconds.

### Updating the deployment

Every time you push changes or want to redeploy:

```bash
npm run deploy:cf
```

There's no auto-deploy from GitHub on the free Workers plan — you trigger deploys manually. (Cloudflare Pages has GitHub auto-deploy, but Workers don't unless you wire up a GitHub Action.)

### Pricing recap (Cloudflare Workers free tier)

| Resource | Free tier | Your proxy typical usage |
|----------|-----------|---------------------------|
| Worker requests | 100,000 / day | ~1–10 per proxied page view |
| CPU time | 10 ms / request | ~1–5 ms (mostly I/O wait) |
| Bandwidth | Unlimited | — |
| Concurrent requests | 50 per region | plenty |

For a personal proxy with a few users, you'll never hit the limits. If you do, Cloudflare's paid plan is $5/month for 10M requests.

## Deploy to Vercel (alternative — Hobby plan is non-commercial only)

If you don't care about AdSense and want a simpler deploy:

1. Push this folder to a new GitHub repo.
2. Go to <https://vercel.com/new> and import the repo.
3. Framework preset is **Next.js**. No env vars are required.
4. Click **Deploy**.

The `vercel.json` included bumps the proxy route's `maxDuration` to 60s.
Vercel Hobby caps serverless functions at 10s — if you're on Hobby, large /
slow pages may still time out; either upgrade to Pro or proxy smaller pages.
**Note:** Vercel Hobby's TOS prohibits commercial use, including AdSense.

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

## WebRTC / TURN relay (for game streaming & video calls)

WebRTC uses direct UDP connections between the browser and the streaming server — HTTP proxies can't carry UDP. **But** the proxy injects a TURN relay server into every proxied page's `RTCPeerConnection` config, so WebRTC traffic flows through TURN (which rides on TCP/UDP) instead of dying on direct connection.

### Default (no signup required)

The proxy uses **Open Relay** (`openrelay.metered.ca`) by default — a free public TURN service with shared credentials. No signup, no env vars needed. The default config also includes Google's free STUN servers for NAT discovery.

**Limits of Open Relay free tier:**
- 500 MB/month of relayed traffic
- Xbox Cloud Gaming uses ~10-20 Mbps → 75-150 MB per minute of streaming → **3-7 minutes of gameplay per month**
- Fine for testing that the setup works, not for actual gaming

### Free TURN options ranked

| Option | Free quota | Setup | Suitable for |
|--------|-----------|-------|--------------|
| **Open Relay** (default) | 500 MB/month | None — just deploy | Testing that TURN works |
| **Cloudflare Calls** | 50 GB/month | API signup + token | ~5-7 hours of Xbox Cloud Gaming per month |
| **Metered.ca TURN** | 1 GB free trial | API signup | One-off longer test sessions |
| **Self-hosted coturn on Oracle Cloud Always Free VPS** | Unlimited | 30 min setup, requires Oracle account | Real ongoing gaming |

### Override the default TURN server (Cloudflare Calls, custom coturn, etc.)

Set these env vars on your Vercel / Cloudflare deployment:

```
TURN_URLS=turn:your-server.com:3478,turn:your-server.com:5349
TURN_USERNAME=your-username
TURN_CREDENTIAL=your-credential
```

The proxy reads these at request time, so you don't need to redeploy to change TURN servers — just update the env vars.

### Using Cloudflare Calls (50 GB/month free)

1. Sign up at [cloudflare.com/products/calls/](https://www.cloudflare.com/products/calls/)
2. Get your `appId` and `appToken` from the dashboard
3. Create a TURN token via the API:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/calls/turn_keys/{key_id}/tokens/generate" \
  -H "Authorization: Bearer {app_token}"
```

4. Use the returned credentials as your `TURN_URLS` / `TURN_USERNAME` / `TURN_CREDENTIAL` env vars.

### Self-hosting coturn on Oracle Cloud Always Free VPS (unlimited free)

This is the best long-term option if you actually want to play games through the proxy. Oracle's Always Free tier includes an Ampere ARM VM with 4 OCPU + 24 GB RAM that never expires and gives you 10 TB/month of outbound traffic — more than enough for unlimited Xbox Cloud Gaming.

#### Step 1: Sign up for Oracle Cloud

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/).
2. Click "Start for free" → sign up with email.
3. You'll need a credit card for verification — it won't be charged unless you explicitly upgrade to a paid account. The Always Free resources stay free forever.
4. Pick a region close to you (lower latency = better game streaming). You can't change regions later.
5. Wait for the activation email — sometimes takes 1-2 hours.

#### Step 2: Create the Always Free ARM VM

1. Log in to the [Oracle Cloud Console](https://cloud.oracle.com).
2. Hamburger menu (top-left) → **Compute → Instances → Create instance**.
3. Configure:
   - **Name:** `turn-server`
   - **Image:** Canonical Ubuntu 22.04 (click "Change image" if it's not Ubuntu)
   - **Shape:** Click "Change shape" → **Ampere** (ARM-based) → `VM.Standard.A1.Flex`
     - Set **Number of OCPUs:** 4 (the free max)
     - Set **Amount of Memory (GB):** 24 (the free max)
   - **Networking:** "Assign a public IPv4 address" (default — should be checked)
   - **Add SSH keys:** Generate a new key pair, download both files. **Save the private key** — you need it to log in.
4. Click **Create**. Takes 1-2 min for the VM to spin up.
5. Once it's running, note the **Public IP Address** shown on the instance page.

#### Step 3: Open firewall ports in Oracle Cloud

The VM has TWO firewalls: Oracle's "Security List" (cloud-level) and iptables (VM-level). The setup script handles iptables automatically. You need to open the Security List manually.

1. Hamburger menu → **Networking → Virtual Cloud Networks** → click your VCN (named `Default` if you didn't change it).
2. Click **Security Lists** in the resources sidebar → click the **Default Security List**.
3. Click **Add Ingress Rules** and add each of these (one rule per port range):

| Source CIDR | IP Protocol | Source Port Range | Destination Port Range | Description |
|-------------|-------------|------------------|------------------------|-------------|
| 0.0.0.0/0 | TCP | All | 3478 | coturn listener TCP |
| 0.0.0.0/0 | UDP | All | 3478 | coturn listener UDP |
| 0.0.0.0/0 | TCP | All | 5349 | TURNS listener TCP (optional, if using TLS) |
| 0.0.0.0/0 | UDP | 49152-65535 | All | relay ports UDP (the actual game stream traffic) |

**Important:** The relay port range `49152-65535` is the UDP port range coturn uses for the actual video traffic. If you skip this rule, the TURN handshake succeeds but the video stream fails.

#### Step 4: SSH into the VPS and run the setup script

From your local machine (Mac/Linux/Windows with WSL):

```bash
# Replace with the path to your downloaded private key
chmod 600 ~/Downloads/ssh-key-*.key
# Replace with the public IP of your VM
# Default Ubuntu user on Oracle Cloud is 'ubuntu'
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_VM_PUBLIC_IP
```

Once you're in, run the setup script:

```bash
# Download and run with no domain (IP-only, no TLS)
# This is the easiest path — works for Xbox Cloud Gaming over UDP on port 3478
curl -fsSL https://raw.githubusercontent.com/YOUR_USER/web-proxy/main/scripts/oracle-vps/coturn-setup.sh -o coturn-setup.sh
bash coturn-setup.sh --user proxyuser --realm oracle-cloud
```

Or with a domain + TLS (recommended, more reliable across networks):

```bash
# First point turn.yourdomain.com (A record) to your VM's public IP at your registrar
bash coturn-setup.sh --domain turn.yourdomain.com --user proxyuser --realm yourdomain.com
```

The script:
1. Installs coturn + certbot
2. Generates a strong 32-char password (prints it to the terminal — copy it)
3. Writes `/etc/turnserver.conf` with sensible defaults
4. Opens iptables ports (TCP 3478, UDP 3478, UDP 49152-65535)
5. If you passed `--domain`, requests a Let's Encrypt cert for TURNS (TURN over TLS on port 5349)
6. Enables coturn to start on boot, starts it now
7. Prints the exact env vars to set on Vercel/Cloudflare

#### Step 5: Set the env vars on your Vercel / Cloudflare deployment

Go to your Vercel project → Settings → Environment Variables (or `npx wrangler secret put` on Cloudflare), and add:

```
TURN_URLS=turn:turn.yourdomain.com:3478,turns:turn.yourdomain.com:5349
TURN_USERNAME=proxyuser
TURN_CREDENTIAL=<the 32-char password from the script output>
```

If you used the no-domain path:

```
TURN_URLS=turn:YOUR_VM_PUBLIC_IP:3478
TURN_USERNAME=proxyuser
TURN_CREDENTIAL=<the 32-char password from the script output>
```

Save. The proxy picks up the new TURN config on the next request — no redeploy needed.

#### Step 6: Test your TURN server

The script prints a URL to [webrtc.github.io/samples/src/content/peerconnection/trickle-ice/](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) — open it, add your TURN server with credentials, click "Gather candidates". If you see `relay` candidates with your VM's IP, the TURN server is working.

#### Step 7: Play through the proxy

1. Visit your deployed proxy URL
2. Enter `https://www.xbox.com/en-US/play`
3. Click "Open" (in the iframe header) → opens the proxied page in a new browser tab
4. Sign in to Xbox Live — cookies stored in your proxy's cookie jar
5. Click **Play** on any game in your library
6. The launcher's WebRTC connection will route through your coturn server on Oracle Cloud

#### Troubleshooting

**"TURN handshake fails"** — likely the Security List ingress rules didn't include UDP port 3478, OR iptables blocked it. The setup script handles iptables; check the Security List manually.

**"Handshake works but video stream is black / drops after 30 seconds"** — almost certainly the relay port range `49152-65535` UDP is blocked. Add that range to the Oracle Security List ingress rules (Step 3, last row).

**"Latency is terrible"** — your VM is in the wrong Oracle region. You can't change a VM's region after creation, but you can spin up another Always Free VM in a closer region (as long as your account's "home region" allows it).

**"coturn crashes on boot"** — check `sudo journalctl -u coturn -n 100 --no-pager`. Most common cause: TLS cert path is wrong if you used `--domain` but the cert didn't get issued (DNS A record not propagated, etc.).

**"How do I rotate the password?"** — re-run `bash coturn-setup.sh --user proxyuser`, which generates a new password. Update env vars on Vercel/Cloudflare. That's it.

**"Can I monitor coturn usage?"** — `sudo systemctl status coturn` shows if it's running. `sudo tail -f /var/log/turnserver.log` shows live traffic. For real stats, install `turnadmin` CLI (included with coturn) — see [coturn wiki](https://github.com/coturn/coturn/wiki).



## Roadmap ideas

- Streaming HTML rewrite (currently buffered, fine for most pages)
- Rate-limit / auth gate for `/api/proxy`
- Option to disable scripts entirely (read-only mode)
- Multi-cookie chunking for jars > 4 KB
