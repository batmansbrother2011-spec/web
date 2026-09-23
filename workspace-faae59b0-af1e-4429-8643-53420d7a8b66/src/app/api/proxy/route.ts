import { NextRequest } from "next/server";
import {
  applySetCookies,
  buildJarSetCookie,
  buildProxyUrl,
  cookiesForHost,
  decodeTarget,
  getJarFromRequest,
  rewriteCss,
  rewriteHtml,
  serializeJar,
  PASSTHROUGH_RESPONSE_HEADERS,
  STRIP_REQUEST_HEADERS,
} from "@/lib/proxy";

export const runtime = "nodejs";
// Vercel hobby functions cap at 10s; bump up to 60s where available.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Default User-Agent. Some sites 403 the default `node` UA. */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function PUT(req: NextRequest) {
  return handle(req);
}

export async function DELETE(req: NextRequest) {
  return handle(req);
}

export async function PATCH(req: NextRequest) {
  return handle(req);
}

export async function HEAD(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest): Promise<Response> {
  const rawTarget = req.nextUrl.searchParams.get("url");
  const target = decodeTarget(rawTarget);
  if (!target) {
    return json({ error: "Missing or invalid `url` query parameter." }, 400);
  }

  // ─── Merge extra query params into the upstream URL ─────────────────────
  // When a GET form is submitted through the proxy, the browser builds:
  //   /api/proxy?url=UPSTREAM_URL&q=hello&btnK=Google+Search
  // The `url=` param tells us the upstream target; the OTHER params (q,
  // btnK, etc.) are the form data the user submitted, which the upstream
  // server expects to receive as query params.
  //
  // We merge them into the upstream URL: if the upstream already has
  // `?q=existing`, the form data takes precedence (matches browser behavior
  // for GET form submission to an action with an existing query string).
  const targetUrl = new URL(target);
  const incomingParams = req.nextUrl.searchParams;
  // Don't forward the proxy's own `url` param.
  const extraParams: Array<[string, string]> = [];
  incomingParams.forEach((value, key) => {
    if (key === "url") return;
    extraParams.push([key, value]);
  });
  if (extraParams.length > 0) {
    // Use URLSearchParams.append so duplicate keys are preserved.
    const merged = new URLSearchParams(targetUrl.search);
    for (const [k, v] of extraParams) {
      // If the upstream URL already has this param, the form's value
      // overrides it (matching browser behavior). Simplest correct behavior:
      // delete existing, then append.
      merged.delete(k);
      merged.append(k, v);
    }
    targetUrl.search = merged.toString();
  }
  const finalTarget = targetUrl.toString();

  // ─── Cookie jar: read incoming jar (we'll look up per-host below) ────────
  let jar = getJarFromRequest(req);
  const targetHost = new URL(finalTarget).hostname;

  // Body for non-GET methods.
  let body: BodyInit | undefined = undefined;
  if (!["GET", "HEAD"].includes(req.method.toUpperCase())) {
    body = await req.arrayBuffer();
  }

  // Fetch with manual redirect handling so we can capture Set-Cookie headers
  // emitted on intermediate 3xx responses (a common pattern for login flows:
  // POST /login → 302 Set-Cookie → 200 /dashboard).
  const MAX_REDIRECTS = 8;
  let currentUrl = finalTarget;
  let currentHost = targetHost;
  let currentJar = jar;
  let upstream: Response;
  let redirectCount = 0;

  try {
    // Build the initial set of outgoing headers (we re-derive for each
    // hop so cookies for the *new* host are picked up from the jar).
    const buildHeaders = (host: string) => {
      const h: Record<string, string> = {
        "User-Agent": UA,
        Accept:
          req.headers.get("accept") ||
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language":
          req.headers.get("accept-language") || "en-US,en;q=0.5",
      };
      const cookieForHost = cookiesForHost(currentJar, host);
      if (cookieForHost) h["Cookie"] = cookieForHost;
      // Pass through other request headers (excluding leaky ones).
      req.headers.forEach((value, key) => {
        const lk = key.toLowerCase();
        if (STRIP_REQUEST_HEADERS.has(lk)) return;
        if (lk === "accept-encoding") return;
        if (lk === "user-agent") return;
        if (lk === "accept" || lk === "accept-language") return;
        if (lk === "cookie") return;
        h[key] = value;
      });
      return h;
    };

    let method = req.method.toUpperCase();
    let reqBody: BodyInit | undefined = body;

    // Loop fetching — manual redirect so we can harvest Set-Cookie at each hop.
    while (true) {
      const headers = buildHeaders(currentHost);
      const isRedirectBody = method !== "GET" && method !== "HEAD";
      upstream = await fetch(currentUrl, {
        method,
        headers,
        body: isRedirectBody ? reqBody : undefined,
        redirect: "manual",
        // @ts-expect-error -- `cache` is a valid fetch init field
        cache: "no-store" as RequestCache,
      });

      // Capture Set-Cookie from this hop (if any) into the jar.
      const sc =
        typeof upstream.headers.getSetCookie === "function"
          ? (upstream.headers as Headers).getSetCookie()
          : [];
      if (sc.length > 0) {
        currentJar = applySetCookies(currentJar, currentHost, sc);
      }

      // Decide whether to follow the redirect.
      const status = upstream.status;
      const isRedirect =
        (status === 301 || status === 302 || status === 303 || status === 307 || status === 308) &&
        redirectCount < MAX_REDIRECTS;

      if (!isRedirect) break;

      const location = upstream.headers.get("location");
      if (!location) break;

      // Resolve location relative to current URL.
      const nextUrl = new URL(location, currentUrl).toString();
      const nextHost = new URL(nextUrl).hostname;

      // 303 always becomes GET; 301/302 historically also became GET for
      // non-GET methods (browsers do this), so we follow that convention.
      if (status === 303 || (method !== "GET" && method !== "HEAD" && (status === 301 || status === 302))) {
        method = "GET";
        reqBody = undefined;
      }

      // For cross-host redirects, the body is dropped above. The new host's
      // cookies will be picked up by buildHeaders on the next iteration.
      currentUrl = nextUrl;
      currentHost = nextHost;
      redirectCount++;

      // Drain the body so the connection can be reused.
      await upstream.arrayBuffer();
    }
  } catch (err) {
    return json(
      { error: "Upstream fetch failed", message: (err as Error).message },
      502,
    );
  }

  // Use the final state.
  jar = currentJar;
  const finalUrl = upstream.url || currentUrl;

  const contentType = upstream.headers.get("content-type") || "";
  const ct = contentType.toLowerCase();
  const respHeaders = new Headers();
  PASSTHROUGH_RESPONSE_HEADERS.forEach((h) => {
    const v = upstream.headers.get(h);
    if (v) respHeaders.set(h, v);
  });

  // Always advertise that this is a proxied response. Use finalUrl so the
  // x-proxy-target reflects any redirects that were followed.
  respHeaders.set("x-proxy-target", finalUrl);
  respHeaders.set("x-proxy-status", String(upstream.status));

  // ─── Cookie jar: write the (possibly updated) jar back to the client ──────
  // Set-Cookie was already harvested from each redirect hop in the loop above;
  // here we just persist the resulting jar back to the browser.
  const updatedJarStr = serializeJar(jar);
  const setCookie = buildJarSetCookie(updatedJarStr);
  if (setCookie) {
    respHeaders.append("Set-Cookie", setCookie);
  }

  // ─── Status codes that MUST NOT have a body ──────────────────────────────
  // Per the Fetch spec, 204 / 205 / 304 responses cannot have a body. The
  // Response constructor throws "Invalid response status code 204" if you try.
  // For these statuses we return immediately with an empty body so proxied
  // JS that hits tracking endpoints (Google's `/gen_204`, etc.) doesn't get
  // a 500 back and break its state machine.
  const NO_BODY_STATUSES = new Set([204, 205, 304]);
  if (NO_BODY_STATUSES.has(upstream.status)) {
    return new Response(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  }

  // HTML: rewrite links / scripts / styles / images to go through the proxy.
  if (ct.includes("text/html") || ct.includes("application/xhtml+xml")) {
    const text = await upstream.text();
    const rewritten = rewriteHtml(text, finalUrl);
    return new Response(rewritten, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  }

  // CSS: rewrite url() / @import.
  if (ct.includes("text/css")) {
    const text = await upstream.text();
    const rewritten = rewriteCss(text, finalUrl);
    return new Response(rewritten, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  }

  // JavaScript: we can't safely rewrite arbitrary JS. The HTML shim injected
  // into proxied HTML pages already patches fetch/XHR globally, so scripts
  // loaded inside a proxied page inherit the patching for free.
  // For XML/SVG/etc. we pass through unchanged.
  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// Helper exported for use in UI/server components if needed.
export { buildProxyUrl };
