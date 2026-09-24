import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Privacy Policy — Vercel Web Proxy",
  description:
    "Privacy policy for the Vercel Web Proxy. What data is collected, how it's stored, who can see it, and how to delete it.",
  keywords: [
    "privacy policy",
    "web proxy privacy",
    "cookie policy",
    "data collection",
  ],
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 flex flex-col gap-8">
        <section>
          <h2 className="text-3xl font-bold tracking-tight">Privacy Policy</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold tracking-tight">Overview</h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            This privacy policy describes how the Vercel Web Proxy (the
            &quot;Service&quot;) handles data when you use it. The Service
            is an HTTP proxy that fetches web pages on your behalf and
            forwards them to your browser. Because of how proxies work,
            some data must be processed to deliver the service — this
            policy explains what data, why, and how long it&apos;s kept.
          </p>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            By using the Service, you consent to the data practices
            described in this policy. If you do not agree with this
            policy, do not use the Service.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            What data we collect
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The Service processes the following categories of data when
            you use it:
          </p>
          <ul className="mt-3 space-y-3 text-base text-muted-foreground">
            <li>
              <strong>URLs you request.</strong> When you enter a URL into
              the proxy, that URL is sent to the proxy server, which
              fetches it on your behalf. The URL is processed in memory
              to fulfill your request and is not persisted by the proxy
              code itself. However, the hosting platform (Vercel or
              Cloudflare) may log the URL as part of standard access logs.
            </li>
            <li>
              <strong>Upstream cookies.</strong> When the upstream site
              you&apos;re proxying sets cookies (e.g. session cookies),
              those cookies are stored in a single HttpOnly cookie on
              the proxy&apos;s domain. This cookie is scoped to the
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">/api/proxy</code>
              path, so it only travels with requests to the proxy endpoint.
              The cookie is stored in your browser, not on the server.
            </li>
            <li>
              <strong>Standard request metadata.</strong> Like any web
              service, the proxy receives your IP address, browser
              User-Agent, and the referring URL with each request. This
              metadata is processed to fulfill your request and is not
              persisted by the proxy code itself, but may be logged by
              the hosting platform.
            </li>
            <li>
              <strong>Browsing history (local only).</strong> The Service
              stores a list of the URLs you&apos;ve recently proxied in
              your browser&apos;s localStorage. This data never leaves
              your device and is not transmitted to the server.
            </li>
          </ul>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            How data is stored
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The Service uses two storage layers:
          </p>
          <ul className="mt-3 space-y-3 text-base text-muted-foreground">
            <li>
              <strong>Browser storage (cookies and localStorage).</strong>
              The cookie jar (upstream cookies) and browsing history are
              stored in your browser. They are scoped to the proxy&apos;s
              domain and only travel with requests to the proxy endpoint.
              They are not accessible to upstream sites you visit through
              the proxy.
            </li>
            <li>
              <strong>Server-side processing.</strong> The proxy fetches
              upstream URLs in memory, processes the response (rewriting
              HTML/CSS, capturing Set-Cookie headers), and returns the
              result. No upstream content is persisted server-side
              between requests. The proxy code does not write any data
              to disk or to a database.
            </li>
          </ul>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            Who can see your data
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Several parties may have access to data processed by the
            Service:
          </p>
          <ul className="mt-3 space-y-3 text-base text-muted-foreground">
            <li>
              <strong>The proxy operator.</strong> Whoever hosts this
              proxy deployment (you, if you self-host) can see the URLs
              you request, your real IP address, and the volume of
              traffic. If you&apos;re using a public deployment hosted by
              someone else, assume they can see this data.
            </li>
            <li>
              <strong>The hosting platform.</strong> Vercel or Cloudflare
              (depending on where the proxy is deployed) may keep access
              logs for their own operational purposes (abuse prevention,
              DDoS mitigation, billing). These logs typically include
              the URL requested, the timestamp, the response status, and
              the requester&apos;s IP address.
            </li>
            <li>
              <strong>Upstream sites.</strong> When the proxy fetches a
              URL on your behalf, the upstream site sees the proxy
              server&apos;s IP address and the proxy&apos;s User-Agent,
              not your real IP. However, upstream sites may still set
              cookies, use browser fingerprinting, or detect proxy
              traffic through other means. The proxy strips
              X-Forwarded-* headers to reduce leakage, but cannot
              fully anonymize you against a determined upstream.
            </li>
            <li>
              <strong>Google AdSense (if ads are enabled).</strong> If
              the deployment has AdSense configured (via the
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-sm">NEXT_PUBLIC_ADSENSE_CLIENT</code>
              env var), Google&apos;s ad serving scripts run on the
              proxy&apos;s home page and may collect standard analytics
              data (browser type, screen resolution, approximate
              location based on IP). This data is governed by{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Google&apos;s Ads Privacy Policy
              </a>
              .
            </li>
          </ul>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            How long data is kept
          </h3>
          <ul className="mt-3 space-y-3 text-base text-muted-foreground">
            <li>
              <strong>Browser cookie jar:</strong> Cookies set by
              upstream sites are kept for 1 year (or until you clear them).
              You can clear them at any time using the &quot;Clear&quot;
              button in the &quot;Logged-in sites&quot; panel on the home
              page, or by clearing your browser&apos;s cookies for the
              proxy domain.
            </li>
            <li>
              <strong>Browsing history (localStorage):</strong> The last
              12 proxied URLs are kept until you clear them via the
              &quot;Clear&quot; button in the History panel, or until you
              clear your browser&apos;s site data.
            </li>
            <li>
              <strong>Server-side data:</strong> No data is persisted
              server-side by the proxy code. Hosting platform access logs
              (Vercel/Cloudflare) may be retained according to the
              platform&apos;s own data retention policies, typically 30-90
              days.
            </li>
          </ul>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            Your rights
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Depending on your jurisdiction (GDPR for EU residents, CCPA
            for California residents, etc.), you may have the right to:
          </p>
          <ul className="mt-3 space-y-2 text-base text-muted-foreground">
            <li>• Access the personal data we hold about you</li>
            <li>• Request deletion of your personal data</li>
            <li>• Object to processing of your personal data</li>
            <li>• Request export of your personal data in a portable format</li>
          </ul>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Because all browser-side data is stored locally and can be
            cleared by you at any time, exercising these rights is as
            simple as clearing your browser&apos;s cookies and site data
            for the proxy domain. For server-side data (access logs held
            by the hosting platform), contact the proxy operator directly.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            Children&apos;s privacy
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The Service is not intended for use by children under the age
            of 13 (or the minimum age in your jurisdiction). The Service
            does not knowingly collect personal information from children.
            If you believe a child has provided personal information
            through the Service, please contact the proxy operator so it
            can be deleted.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            Changes to this policy
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The proxy operator may update this privacy policy from time
            to time. The &quot;Last updated&quot; date at the top of
            this page indicates when the policy was last revised. We
            encourage you to review this page periodically to stay
            informed about how your data is being handled.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">Contact</h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            If you have questions about this privacy policy or want to
            exercise your data rights, contact the proxy operator. If
            you&apos;re using a publicly-hosted deployment and
            don&apos;t know who the operator is, your best option is to
            deploy your own copy (download the source from the home
            page) so you have full control over your data.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
