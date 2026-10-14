import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "FAQ — Vercel Web Proxy",
  description:
    "Frequently asked questions about the Vercel Web Proxy: how it works, what it can and can't do, security, cookies, deployment, and troubleshooting.",
  keywords: [
    "web proxy faq",
    "vercel proxy questions",
    "how does web proxy work",
    "proxy limitations",
    "xbox cloud gaming proxy",
  ],
};

interface QA {
  q: string;
  a: string;
}

const FAQS: QA[] = [
  {
    q: "What is a web proxy?",
    a: "A web proxy is a server that fetches web pages on your behalf and forwards them to your browser. When you use a proxy, the websites you visit see the proxy's IP address, not your real one. This can be useful for privacy, bypassing geo-restrictions, or accessing content that's blocked in your region. Our proxy specifically rewrites the HTML, CSS, and JavaScript of the pages it fetches so that all subsequent requests (for images, scripts, stylesheets, etc.) also flow through the proxy — meaning your real IP is never exposed to the target site, even on subsequent clicks.",
  },
  {
    q: "How is this different from a VPN?",
    a: "A VPN routes ALL your network traffic (TCP, UDP, WebRTC, DNS) through a remote server. This proxy only routes HTTP and HTTPS traffic — it cannot carry UDP traffic, which means it can't proxy WebRTC video calls, online games, or game streaming services like Xbox Cloud Gaming. VPNs also typically install a system-level network adapter, while a web proxy only affects traffic going through your browser to the proxy's URL. VPNs are more comprehensive; proxies are simpler and more targeted.",
  },
  {
    q: "Is this proxy anonymous?",
    a: "Partially. The websites you visit through the proxy see the proxy server's IP address, not your real IP. However, the proxy operator (whoever hosts the proxy on Vercel or Cloudflare) can see which sites you're visiting and how much traffic you're generating. If you're using a publicly-hosted proxy, the operator can theoretically log your activity. For full anonymity, host your own copy on your own Vercel/Cloudflare account — the project is open source and the download link is on the home page.",
  },
  {
    q: "Does the proxy log my activity?",
    a: "The proxy code itself does not log the URLs you visit or the content of the pages you fetch. However, the hosting platform (Vercel or Cloudflare) may keep access logs for their own operational purposes (DDoS protection, abuse prevention, billing). These logs typically include the URL requested, the timestamp, the response status, and your real IP address. If you need stronger privacy, deploy your own copy on a VPS you control, where you can configure logging to your own preferences.",
  },
  {
    q: "Can I sign into websites through the proxy?",
    a: "Yes — the proxy maintains a per-host cookie jar that stores session cookies set by upstream sites. When you sign in to a site through the proxy, the session cookie is captured and replayed on subsequent requests, so you stay logged in as you navigate. However, some sites (Google, banking sites, some e-commerce checkouts) detect proxy environments and refuse to load. If a login flow redirects you to an error page, that's likely the cause.",
  },
  {
    q: "Can I use this to play Xbox Cloud Gaming?",
    a: "No. Xbox Cloud Gaming uses WebRTC over UDP for the actual game stream, and HTTP proxies cannot carry UDP traffic. The launcher page (where you click Play) will load through the proxy, but the game stream itself won't work. To play Xbox Cloud Gaming from a different region, you need a real VPN that supports UDP — Mullvad, ProtonVPN, or your own WireGuard server are all good options.",
  },
  {
    q: "Why does TikTok show a CAPTCHA?",
    a: "TikTok has aggressive anti-bot detection that recognizes proxy traffic and challenges it with a CAPTCHA. There's no way to bypass this from an HTTP proxy — TikTok's bot detection looks at request patterns, TLS fingerprints, and behavioral signals that are hard to spoof. If you need to access TikTok through a proxy, the only reliable solution is a residential proxy network (which routes traffic through real home ISPs), and even those get detected eventually.",
  },
  {
    q: "Can I host my own copy?",
    a: "Yes — the full source code is in the project ZIP, downloadable from the home page. Unzip it, push to a new GitHub repo, and import at vercel.com/new or use the Cloudflare Workers instructions in the README. The whole process takes about five minutes from download to live URL. The free tier of either Vercel or Cloudflare is enough for personal use.",
  },
  {
    q: "Is this free?",
    a: "The proxy code is open source under the MIT license — free to use, modify, and distribute. Hosting on Vercel or Cloudflare's free tier is also free for personal use (with limits — typically 100,000 requests per day on Cloudflare, or 100 GB-hours of serverless execution per month on Vercel Hobby). If you exceed those limits, you'd need to upgrade to a paid plan. Self-hosting on a VPS (Oracle Cloud Always Free, Hetzner, etc.) is unlimited but requires more setup.",
  },
  {
    q: "Can I add Google AdSense to my proxy?",
    a: "Yes — the project includes built-in AdSense support. Set the NEXT_PUBLIC_ADSENSE_CLIENT environment variable on your Vercel/Cloudflare deployment to your publisher ID (looks like ca-pub-1234567890123456), redeploy, and ads will appear in the two sidebar slots. You'll need to be approved by AdSense first — they review your site for content quality, navigation, and policy compliance. The /about, /faq, /privacy-policy, and /terms pages on this site exist primarily to satisfy AdSense's content quality requirements.",
  },
  {
    q: "How do I clear my cookie jar?",
    a: "On the home page, look for the 'Logged-in sites' panel in the bottom section. If any sites have set cookies, a 'Clear' button will appear next to the panel title. Click it to wipe all stored cookies. You can also clear cookies by clearing your browser's cookies for the proxy's domain (the cookie is named 'proxy_cookies' and is scoped to the /api/proxy path).",
  },
  {
    q: "Why does the proxy sometimes hang or show a blank page?",
    a: "The most common causes are: (1) the target site is slow to respond and the proxy is waiting (serverless functions have a timeout — 10 seconds on Vercel Hobby, 60 seconds on Pro); (2) the target site has detected the proxy and is refusing to serve content; (3) the target site is using WebSockets or WebRTC that the proxy can't carry; (4) the target site sets X-Frame-Options or CSP frame-ancestors that the proxy strips but the browser still enforces in some edge cases. Try clicking 'Open' to launch the proxied page in a new browser tab, which bypasses the iframe entirely.",
  },
  {
    q: "Can I use this proxy for automated scraping?",
    a: "Technically yes, but please don't. The proxy is designed for interactive browser use, not high-volume automated requests. If you scrape through a public proxy, you'll quickly exhaust the free tier limits and the operator will be billed. If you need to scrape at scale, use a dedicated scraping service (Bright Data, ScraperAPI, etc.) that's designed for that purpose and has the appropriate infrastructure and IP rotation.",
  },
  {
    q: "What happens if someone abuses my public proxy deployment?",
    a: "If you deploy this proxy publicly (anyone with the URL can use it), people may use it to launder automated requests, bypass rate limits, or access content that violates your hosting provider's terms. Vercel and Cloudflare both have abuse policies — if they receive complaints about traffic from your deployment, they may suspend your account. To prevent abuse, consider: (1) keeping the URL private, (2) adding authentication (the project supports NextAuth.js but it's not configured by default), (3) adding rate-limiting (not included by default), or (4) deploying to a VPS where you have more control.",
  },
  {
    q: "How do I report a bug or request a feature?",
    a: "The project is open source — fork it on GitHub, make your changes, and submit a pull request. If you found a security issue, please don't open a public GitHub issue; instead, contact the project maintainer directly. Keep in mind that this is a personal project with no SLA — bugs may or may not get fixed depending on the maintainer's availability.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 flex flex-col gap-6">
        <section>
          <h2 className="text-3xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Common questions about how the Vercel Web Proxy works, what it
            can and can&apos;t do, security and privacy considerations, and
            how to deploy your own copy. If your question isn&apos;t
            answered here, the <a href="/about" className="text-primary hover:underline">About page</a> has more
            detailed technical information.
          </p>
        </section>

        <Separator />

        <div className="flex flex-col gap-6">
          {FAQS.map((faq, i) => (
            <section key={i} className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold tracking-tight">
                {faq.q}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {faq.a}
              </p>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
