import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Terms of Service — Vercel Web Proxy",
  description:
    "Terms of service for the Vercel Web Proxy. Acceptable use, prohibited uses, liability, and dispute resolution.",
  keywords: [
    "terms of service",
    "web proxy terms",
    "acceptable use",
    "user agreement",
  ],
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 flex flex-col gap-8">
        <section>
          <h2 className="text-3xl font-bold tracking-tight">
            Terms of Service
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            1. Acceptance of terms
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            By accessing or using the Vercel Web Proxy (the
            &quot;Service&quot;), you agree to be bound by these Terms
            of Service (&quot;Terms&quot;). If you do not agree to
            these Terms, you may not access or use the Service. These
            Terms form a legally binding agreement between you and the
            operator of the Service (the &quot;Operator&quot;).
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            2. Description of service
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The Service is an HTTP proxy that fetches web pages on
            your behalf and forwards them to your browser. The Service
            rewrites HTML, CSS, and JavaScript to route subsequent
            requests (images, scripts, stylesheets, etc.) through the
            proxy. The Service is provided &quot;as is&quot; without
            warranty of any kind, express or implied.
          </p>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The Service is designed for personal browsing, geo-bypass
            testing, content research, and security reviews. The
            Operator reserves the right to modify, suspend, or
            discontinue the Service at any time without notice.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            3. Acceptable use
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            You agree to use the Service only for lawful purposes and
            in a manner that does not infringe the rights of, restrict,
            or inhibit anyone else&apos;s use and enjoyment of the
            Service. By way of example, and not as a limitation, you
            agree not to:
          </p>
          <ul className="mt-3 space-y-2 text-base text-muted-foreground">
            <li>• Use the Service to violate any law, regulation, or third-party right</li>
            <li>• Use the Service to upload, post, or otherwise transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
            <li>• Use the Service to infringe upon any patent, trademark, trade secret, copyright, or other intellectual property right of any party</li>
            <li>• Use the Service to send unsolicited communications, advertising, or promotional material (&quot;spam&quot;)</li>
            <li>• Use the Service to access, probe, or scan the network infrastructure of any third party without authorization</li>
            <li>• Use the Service to interfere with, disrupt, or negatively affect any other user&apos;s ability to use the Service</li>
            <li>• Use the Service for high-volume automated scraping, crawling, or data extraction</li>
            <li>• Use the Service to bypass security controls, rate limits, or authentication mechanisms of any third-party service</li>
            <li>• Resell, sublicense, or otherwise commercialize access to the Service without the Operator&apos;s written consent</li>
          </ul>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            4. Privacy and data
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Your use of the Service is also governed by our{" "}
            <a
              href="/privacy-policy"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
            , which describes how we collect, use, and disclose
            information about you. By using the Service, you consent
            to the data practices described in the Privacy Policy.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            5. Intellectual property
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The Service&apos;s source code is open source under the
            MIT license. You may use, modify, and distribute the source
            code in accordance with the terms of the MIT license. The
            Service does not claim ownership of any content transmitted
            through it — all such content remains the property of its
            respective owners.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            6. Disclaimer of warranties
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE,&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES
            OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. THE OPERATOR DOES NOT WARRANT THAT THE
            SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR
            THAT ANY DEFECTS WILL BE CORRECTED.
          </p>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            You use the Service at your own risk. The Service is not
            intended for use in circumstances where its failure could
            lead to death, personal injury, or severe environmental
            or property damage.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            7. Limitation of liability
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE
            OPERATOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS
            OR REVENUE, ARISING OUT OF OR RELATED TO YOUR USE OF THE
            SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT
            (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER
            OR NOT THE OPERATOR HAS BEEN INFORMED OF THE POSSIBILITY
            OF SUCH DAMAGE.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            8. Indemnification
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            You agree to indemnify, defend, and hold harmless the
            Operator and its affiliates from and against any claims,
            liabilities, damages, losses, and expenses (including
            reasonable attorneys&apos; fees) arising out of or in any
            way connected with your access to or use of the Service,
            or your violation of these Terms.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            9. Termination
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The Operator may terminate or suspend your access to the
            Service at any time, without prior notice or liability,
            for any reason, including if you breach these Terms. Upon
            termination, your right to use the Service will immediately
            cease. Any data stored in your browser via the Service
            (cookie jar, browsing history) will persist until you
            clear your browser&apos;s site data for the proxy domain.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            10. Governing law
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in
            accordance with the laws of the jurisdiction in which the
            Operator resides, without regard to its conflict of law
            provisions. Any disputes arising under these Terms shall
            be resolved in the courts of that jurisdiction.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            11. Changes to these terms
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The Operator reserves the right to modify these Terms at
            any time. The &quot;Last updated&quot; date at the top of
            this page indicates when the Terms were last revised.
            Your continued use of the Service after any changes
            constitutes acceptance of the new Terms. If you do not
            agree to the new Terms, you must stop using the Service.
          </p>
        </section>

        <Separator />

        <section>
          <h3 className="text-xl font-semibold tracking-tight">
            12. Contact
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            If you have any questions about these Terms, please
            contact the Operator. If you&apos;re using a publicly-hosted
            deployment and don&apos;t know who the Operator is, your
            best option is to deploy your own copy (download the source
            from the home page).
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
