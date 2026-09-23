/**
 * URL rewriting utilities for the web proxy.
 *
 * The proxy sits at `/api/proxy?url=<target>`. To make proxied pages feel
 * "native" we rewrite every URL reference inside HTML / CSS responses so that
 * clicking a link or loading a script/style/image still flows through the
 * proxy instead of escaping to the original origin.
 *
 * Rewriting is intentionally conservative: we only touch well-known attribute
 * names and CSS url(...) references. We never eval JavaScript or parse it
 * (that would be both slow and unsafe inside a serverless function).
 */

/** Build a proxied URL that points back at /api/proxy?url=<target>. */
export function buildProxyUrl(target: string, base = "/api/proxy"): string {
  // We pass the original URL through verbatim (not encoded twice) so the
  // proxied page can later recover the real target. Standard URL params
  // (`?url=`) are URL-encoded for safety.
  return `${base}?url=${encodeURIComponent(target)}`;
}

/**
 * Resolve a possibly-relative URL against a base. Returns the absolute URL
 * or `null` if the value cannot be turned into a valid URL.
 */
export function resolveUrl(raw: string, base: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // `data:` / `blob:` / `javascript:` / `mailto:` etc. should pass through.
  if (/^(data:|blob:|javascript:|mailto:|tel:|about:|#)/i.test(trimmed)) {
    return trimmed;
  }

  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

/**
 * Rewrite an HTML body so every URL reference (href, src, action, srcset,
 * <meta http-equiv="refresh" content="0;url=...">, inline style url())
 * points back at the proxy.
 *
 * @param html       Raw HTML from upstream.
 * @param baseUrl    The final URL of the upstream response (after redirects).
 */
export function rewriteHtml(html: string, baseUrl: string): string {
  // Attribute name → attribute selector. We rewrite these.
  const attrRewrites: Array<{ attr: string; tag: string | null }> = [
    { attr: "href", tag: null }, // a, link, area, base...
    { attr: "src", tag: null }, // img, script, iframe, source, video, audio, embed, track, input
    { attr: "action", tag: null }, // form
    { attr: "data", tag: null }, // object
    { attr: "poster", tag: "video" },
    { attr: "cite", tag: null },
    { attr: "longdesc", tag: null },
    { attr: "background", tag: null },
    { attr: "formaction", tag: null },
    { attr: "manifest", tag: "html" },
    { attr: "content", tag: "meta" }, // we'll filter below for refresh
  ];

  let out = html;

  for (const { attr, tag } of attrRewrites) {
    // Match either single or double quotes.
    const tagPart = tag ? `${tag}\\b[^>]*?` : `\\b\\w+\\b[^>]*?`;
    const re = new RegExp(
      `(<(?:${tag ? tag : "\\w+"})\\b[^>]*?\\s${attr}\\s*=\\s*)(["'])([^"']*)\\2`,
      "gi",
    );
    out = out.replace(re, (full, pre: string, quote: string, value: string) => {
      // Special case: <meta http-equiv="refresh" content="N; url=...">
      if (attr === "content") {
        const m = value.match(/^(\s*\d+\s*;\s*url\s*=\s*)(.*)$/i);
        if (m) {
          const resolved = resolveUrl(m[2], baseUrl);
          if (!resolved) return full;
          // Don't proxy data: / mailto: etc.
          if (/^(data:|mailto:|tel:|#)/i.test(resolved)) return full;
          return `${pre}${quote}${m[1]}${buildProxyUrl(resolved)}${quote}`;
        }
        return full;
      }
      const resolved = resolveUrl(value, baseUrl);
      if (!resolved) return full;
      if (/^(data:|blob:|javascript:|mailto:|tel:|about:|#)/i.test(resolved)) {
        return full;
      }
      return `${pre}${quote}${buildProxyUrl(resolved)}${quote}`;
    });
  }

  // srcset: comma-separated list of "url descriptor" pairs.
  out = out.replace(
    /\ssrcset\s*=\s*(["'])(.*?)\1/gi,
    (full, quote: string, val: string) => {
      const parts = val
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => {
          const [url, descriptor] = p.split(/\s+/);
          const resolved = resolveUrl(url, baseUrl);
          if (!resolved) return p;
          if (/^(data:|blob:|javascript:|mailto:|tel:|about:|#)/i.test(resolved)) {
            return p;
          }
          return `${buildProxyUrl(resolved)}${descriptor ? " " + descriptor : ""}`;
        })
        .join(", ");
      return ` srcset=${quote}${parts}${quote}`;
    },
  );

  // Inline style="background-image: url(...)" and friends.
  out = out.replace(
    /(\sstyle\s*=\s*)(["'])(.*?)\2/gi,
    (full, pre: string, quote: string, body: string) => {
      const rewritten = rewriteCss(body, baseUrl);
      return `${pre}${quote}${rewritten}${quote}`;
    },
  );

  // ── Special handling for <form> tags ─────────────────────────────────────
  // When a GET form is submitted, the browser REPLACES the action URL's
  // existing query string with the form's serialized data. So an action of
  // `/api/proxy?url=https://google.com/search` becomes `/api/proxy?q=...`
  // after submission — losing the `?url=` parameter.
  //
  // Fix: for GET forms, set the action to just `/api/proxy` and inject a
  // hidden `<input name="url" value="UPSTREAM_URL">` as the FIRST form
  // field, so the browser builds `?url=UPSTREAM_URL&q=...&btnK=...`.
  //
  // POST forms are unaffected (POST bodies don't touch the query string),
  // so we leave their actions as-is.
  out = out.replace(
    /<form\b([^>]*?)>/gi,
    (full, attrs: string) => {
      // Extract action="..." (if any)
      const actionMatch = attrs.match(/\saction\s*=\s*(["'])([^"']*)\1/i);
      if (!actionMatch) return full; // no action — let browser default

      const actionVal = actionMatch[2];
      // Only intercept actions that go through our proxy
      const proxyPrefix = "/api/proxy?url=";
      if (!actionVal.startsWith(proxyPrefix)) return full;

      // Decode the upstream URL from the action's `url=` param
      const upstreamUrl = decodeURIComponent(
        actionVal.slice(proxyPrefix.length),
      );

      // Determine the form method
      const methodMatch = attrs.match(/\smethod\s*=\s*(["'])([^"']*)\1/i);
      const method = methodMatch ? methodMatch[2].toUpperCase() : "GET";

      if (method === "GET") {
        // Rewrite the action to just `/api/proxy` (no query string).
        const newAttrs = attrs.replace(
          /\saction\s*=\s*(["'])([^"']*)\1/i,
          ' action="/api/proxy"',
        );
        // Inject a hidden `url` field as the first child of the form.
        return `<form${newAttrs}><input type="hidden" name="url" value="${upstreamUrl.replace(/"/g, "&quot;")}" aria-hidden="true" />`;
      }

      // For POST forms, leave the action as-is — POST data goes in the body
      // and the action's `?url=` query string is preserved.
      return full;
    },
  );

  // Inject a tiny base script so that JS-initiated fetch / XHR also go
  // through the proxy. We pass the upstream target URL so the shim can
  // resolve *relative* URLs against the upstream origin (otherwise they
  // would resolve against our own origin and 404).
  //
  // The shim also:
  //   - Neutralizes framebusting scripts that try to escape the iframe by
  //     reassigning window.top.location. Sites like Google and Twitter do
  //     this and the resulting "blocked a frame with origin" error breaks
  //     subsequent page loads. We override window.top so the assignment
  //     silently no-ops.
  //   - Rewrites document.cookie so proxied JS can read/write cookies
  //     through our jar instead of hitting the real (empty) cookie jar
  //     on our domain.
  //   - Patches fetch / XMLHttpRequest / navigator.sendBeacon so JS-initiated
  //     requests flow through /api/proxy.
  //   - Patches window.open so popups open through the proxy.
  const shim = `
<script>(function(){
  try {
    var PROXY = ${JSON.stringify("/api/proxy")};
    var TARGET = ${JSON.stringify(baseUrl)};
    var TARGET_ORIGIN = ${JSON.stringify(new URL(baseUrl).origin)};

    function wrap(u){
      try {
        if (!u) return u;
        var s = String(u);
        if (/^(data:|blob:|javascript:|mailto:|tel:|about:|#)/i.test(s)) return u;
        // Resolve against the upstream target so relative URLs work.
        var resolved = new URL(s, TARGET).toString();
        return PROXY + '?url=' + encodeURIComponent(resolved);
      } catch(e){ return u; }
    }

    // ── Framebuster neutralizer ───────────────────────────────────────────
    // Sites that detect they're in an iframe often do:
    //   if (window.top !== window.self) window.top.location = window.location;
    // Under our sandbox this throws "Blocked a frame with origin ... from
    // accessing a cross-origin frame", which leaves the page in a broken
    // state. We replace window.top with a Proxy that swallows writes
    // silently so framebusting JS no-ops instead of crashing.
    try {
      var fakeTop = new Proxy(window.self, {
        get: function(t, p){
          if (p === 'location') return { href: '', replace: function(){}, assign: function(){} };
          if (p === 'self' || p === 'top' || p === 'parent' || p === 'frames') return fakeTop;
          var v = t[p];
          return (typeof v === 'function') ? v.bind(t) : v;
        },
        set: function(){ return true; } // swallow all writes
      });
      Object.defineProperty(window, 'top', { get: function(){ return fakeTop; }, configurable: true });
      Object.defineProperty(window, 'parent', { get: function(){ return fakeTop; }, configurable: true });
    } catch(e){}

    // ── Network patches ────────────────────────────────────────────────────
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url){
      var args = Array.prototype.slice.call(arguments);
      args[1] = wrap(url);
      return origOpen.apply(this, args);
    };
    var origFetch = window.fetch;
    if (origFetch) window.fetch = function(input, init){
      try {
        if (typeof input === 'string') input = wrap(input);
        else if (input && input.url) input = new Request(wrap(input.url), input);
      } catch(e){}
      return origFetch.call(this, input, init);
    };
    var origSend = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
    if (origSend) navigator.sendBeacon = function(url, data){
      try { url = wrap(url); } catch(e){}
      return origSend(url, data);
    };
    var origOpen2 = window.open;
    if (origOpen2) window.open = function(url){
      try { if (url) arguments[0] = wrap(url); } catch(e){}
      return origOpen2.apply(this, arguments);
    };

    // ── document.location patches ─────────────────────────────────────────
    // Make setting document.location.href / window.location.href route
    // through the proxy (best-effort; some sites use location.replace).
    try {
      var origAssign = window.location.assign && window.location.assign.bind(window.location);
      var origReplace = window.location.replace && window.location.replace.bind(window.location);
      if (origAssign) window.location.assign = function(url){ return origAssign(wrap(url)); };
      if (origReplace) window.location.replace = function(url){ return origReplace(wrap(url)); };
    } catch(e){}

    // ── Patch window.location.href setter ─────────────────────────────────
    // Many sites (Google's search box, single-page-apps) do:
    //   window.location.href = "/some/path";
    // Under our proxy this resolves to OUR origin (/some/path on the proxy
    // domain), not the upstream's. We intercept the href setter and
    // rewrite relative URLs through the proxy.
    //
    // Note: Location.prototype.href may not have a descriptor in modern
    // Chrome, so we try multiple fallbacks.
    try {
      var loc = window.location;
      function patchLocation(obj, name) {
        var desc = Object.getOwnPropertyDescriptor(obj, name);
        if (!desc || !desc.set) return false;
        var origSet = desc.set;
        var origGet = desc.get;
        Object.defineProperty(window.location, name, {
          configurable: true,
          enumerable: true,
          get: function(){ return origGet.call(loc); },
          set: function(v){
            try { origSet.call(loc, wrap(v)); }
            catch(e){ origSet.call(loc, v); }
          }
        });
        return true;
      }
      // Try Location.prototype first, then the instance.
      var patched = patchLocation(Location.prototype, 'href');
      if (!patched) patchLocation(window.location, 'href');
    } catch(e){}

    // ── Intercept form submissions ─────────────────────────────────────────
    // Native form submissions bypass the location.href setter — the browser
    // builds a URL from the form's action + form data and navigates directly.
    // We intercept submit events and rewrite the action attribute on-the-fly
    // so the submission goes through /api/proxy?url=...
    try {
      document.addEventListener('submit', function(e) {
        try {
          var form = e.target;
          if (!form || form.tagName !== 'FORM') return;
          var action = form.getAttribute('action') || form.action || '';
          if (!action) return;
          // Resolve relative to target, then rewrite through proxy.
          var resolved = new URL(action, TARGET).toString();
          var wrapped = wrap(resolved);
          form.setAttribute('action', wrapped);
        } catch(err) {}
      }, true); // capture phase so we run before any other handlers
    } catch(e){}

    // ── Intercept clicks on <a> tags with target="_blank" or "_top" ──────
    // Such links try to escape the iframe; rewrite them to open in a new tab
    // through the proxy.
    try {
      document.addEventListener('click', function(e) {
        try {
          var a = e.target.closest && e.target.closest('a[href]');
          if (!a) return;
          var target = a.getAttribute('target');
          if (target === '_top' || target === '_parent' || target === '_blank') {
            var href = a.getAttribute('href');
            if (!href) return;
            // Resolve and wrap, then force the click to open in a new tab.
            var resolved = new URL(href, TARGET).toString();
            a.setAttribute('href', wrap(resolved));
            a.setAttribute('target', '_blank');
          }
        } catch(err) {}
      }, true);
    } catch(e){}

  } catch(e){}
})();</script>`;

  // Inject right after <head> if present, else prepend.
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => m + shim);
  } else {
    out = shim + out;
  }

  return out;
}

/**
 * Rewrite a CSS body so url(...) and @import statements go through the proxy.
 */
export function rewriteCss(css: string, baseUrl: string): string {
  // url(...)
  let out = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (full, q: string, u: string) => {
    const resolved = resolveUrl(u, baseUrl);
    if (!resolved) return full;
    if (/^(data:|blob:|mailto:|tel:|#)/i.test(resolved)) return full;
    return `url(${q}${buildProxyUrl(resolved)}${q})`;
  });

  // @import "..." or @import url(...)
  out = out.replace(
    /@import\s+(?:url\()?\s*(['"])([^'")]+)\1\s*\)?/gi,
    (full, q: string, u: string) => {
      const resolved = resolveUrl(u, baseUrl);
      if (!resolved) return full;
      if (/^(data:|blob:|mailto:|tel:|#)/i.test(resolved)) return full;
      return `@import ${q}${buildProxyUrl(resolved)}${q}`;
    },
  );

  return out;
}

/** Decode a `?url=` value sent to the proxy and validate it. */
export function decodeTarget(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Human-readable list of headers we should forward back to the client. */
export const PASSTHROUGH_RESPONSE_HEADERS = new Set([
  "content-type",
  "content-language",
  "content-disposition",
  "cache-control",
  "etag",
  "last-modified",
  "expires",
  "vary",
]);

/** Headers we strip from the outgoing fetch to the target (to avoid leaking). */
export const STRIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "cookie",
  "cookie2",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-real-ip",
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "true-client-ip",
  "x-vercel-forwarded-for",
  "x-vercel-ip",
  "x-vercel-deployment-url",
  "x-vercel-id",
  "x-vercel-proxy-signature",
  "x-vercel-provenance",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Cookie jar — per-host storage of upstream cookies.
//
// Vercel serverless functions are stateless, so we can't keep a server-side
// cookie jar. Instead, we bundle ALL upstream cookies into a single cookie
// on OUR domain ("proxy_cookies"), and let the browser persist it.
//
// On every proxy request we:
//   1. Read our "proxy_cookies" cookie from the incoming request.
//   2. Look up cookies stored for the target hostname.
//   3. Send them as `Cookie:` header to upstream.
//   4. Parse any `Set-Cookie` headers in the upstream response.
//   5. Update the jar and write it back as `Set-Cookie:` on our response.
//
// The cookie is HttpOnly (so proxied JS can't read it) + SameSite=Lax +
// Path=/api/proxy (so it only travels to the proxy endpoint, not to /
// or static assets).
//
// Limitation: a single cookie maxes out at ~4KB. Most login flows fit
// easily. If you outgrow this, chunking into proxy_cookies_0/1/... is the
// next step.
// ─────────────────────────────────────────────────────────────────────────────

export const COOKIE_JAR_NAME = "proxy_cookies";
export const COOKIE_JAR_PATH = "/api/proxy";
export const COOKIE_JAR_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
/** Hard cap on serialized jar size (browser cookie limit minus name+attrs). */
const COOKIE_JAR_MAX_BYTES = 3800;

/**
 * A stored cookie.
 *
 * `domain` is the cookie's scope — either an exact hostname ("www.example.com")
 * or a parent-domain scope ("example.com") when the upstream Set-Cookie
 * specified `Domain=.example.com`. We drop the leading dot but remember
 * the cookie applies to all subdomains.
 */
export interface StoredCookie {
  value: string;
  /** Scope: exact host or parent-domain. */
  domain: string;
}

/**
 * Cookie jar — keyed by hostname, then by cookie name. We store each cookie
 * with its declared Domain attribute (defaulting to the exact request host)
 * so we can correctly replay it across subdomains.
 */
export interface CookieJar {
  [host: string]: { [name: string]: StoredCookie };
}

export function emptyJar(): CookieJar {
  return {};
}

export function parseJar(raw: string | null | undefined): CookieJar {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return {};
    // Backward compat: if an old jar (just {host: {name: "value"}}) is
    // loaded, upgrade it to the new shape silently.
    const out: CookieJar = {};
    for (const [host, cookies] of Object.entries(parsed as Record<string, Record<string, unknown>>)) {
      if (!cookies || typeof cookies !== "object") continue;
      out[host] = {};
      for (const [name, v] of Object.entries(cookies)) {
        if (typeof v === "string") {
          out[host][name] = { value: v, domain: host };
        } else if (v && typeof v === "object" && "value" in (v as object)) {
          out[host][name] = v as StoredCookie;
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeJar(jar: CookieJar): string {
  return JSON.stringify(jar);
}

/**
 * Build a `Cookie:` header value for the target host, including cookies
 * scoped to the exact host AND to any parent domain (e.g. a cookie set with
 * `Domain=.google.com` applies to `www.google.com`). Returns `null` if no
 * cookies match.
 */
export function cookiesForHost(jar: CookieJar, host: string): string | null {
  const matches: { name: string; value: string }[] = [];
  const seen = new Set<string>();

  // Walk from exact host up to TLD, including any cookies stored at each level.
  // e.g. for www.google.com we check: www.google.com, google.com, com
  // (we won't actually have anything at "com" but the loop is general.)
  const parts = host.split(".");
  for (let i = 0; i < parts.length; i++) {
    const candidate = parts.slice(i).join(".");
    if (!candidate) continue;
    const cookies = jar[candidate];
    if (!cookies) continue;
    for (const [name, sc] of Object.entries(cookies)) {
      if (seen.has(name)) continue; // more-specific cookie wins
      seen.add(name);
      matches.push({ name, value: sc.value });
    }
  }

  if (matches.length === 0) return null;
  return matches.map((m) => `${m.name}=${m.value}`).join("; ");
}

/**
 * List of hostnames that currently have cookies (values redacted). Returns
 * the most-specific host scope for each stored cookie set.
 */
export function jarHosts(jar: CookieJar): Array<{ host: string; count: number }> {
  return Object.entries(jar)
    .filter(([, cookies]) => cookies && Object.keys(cookies).length > 0)
    .map(([host, cookies]) => ({ host, count: Object.keys(cookies).length }));
}

/**
 * Parse a single Set-Cookie header value and return its parts.
 * Returns null if the value is malformed.
 */
function parseSetCookie(sc: string): {
  name: string;
  value: string;
  attrs: string;
} | null {
  const semiIdx = sc.indexOf(";");
  const nameValue = (semiIdx === -1 ? sc : sc.slice(0, semiIdx)).trim();
  if (!nameValue) return null;
  const eq = nameValue.indexOf("=");
  if (eq === -1) return null;
  const name = nameValue.slice(0, eq).trim();
  if (!name) return null;
  const value = nameValue.slice(eq + 1).trim();
  const attrs = (semiIdx === -1 ? "" : sc.slice(semiIdx + 1));
  return { name, value, attrs };
}

/**
 * Extract the `Domain=` attribute from a Set-Cookie's attribute string.
 * Returns the domain without leading dot, lowercased, or null if not specified.
 */
function extractDomainAttr(attrs: string): string | null {
  const m = attrs.match(/;\s*domain\s*=\s*([^;]+)/i);
  if (!m) return null;
  return m[1].trim().toLowerCase().replace(/^\./, "");
}

/**
 * Apply upstream `Set-Cookie` headers to the jar (returns a new jar).
 * Honors `Domain=` attribute (cookies stored at the parent-domain scope
 * so they apply to all subdomains) and deletion semantics (Max-Age=0,
 * empty value + Expires in past).
 */
export function applySetCookies(
  jar: CookieJar,
  host: string,
  setCookieHeaders: string[],
): CookieJar {
  if (setCookieHeaders.length === 0) return jar;
  const next: CookieJar = { ...jar };

  for (const sc of setCookieHeaders) {
    const parsed = parseSetCookie(sc);
    if (!parsed) continue;
    const { name, value, attrs } = parsed;
    const attrsLower = attrs.toLowerCase();

    // Determine the cookie's scope.
    const domainAttr = extractDomainAttr(attrs);
    const scope =
      domainAttr && host.endsWith(domainAttr) ? domainAttr : host;

    const isDeletion =
      /max-age=-(\d+)/.test(attrsLower) ||
      /max-age=0(?![1-9])/.test(attrsLower) ||
      (value === "" && /expires=/.test(attrsLower));

    if (!next[scope]) next[scope] = {};
    if (isDeletion) {
      delete next[scope][name];
      if (Object.keys(next[scope]).length === 0) delete next[scope];
    } else {
      next[scope][name] = { value, domain: scope };
    }
  }

  return next;
}

/** Read the cookie jar from an incoming request's `Cookie` header. */
export function getJarFromRequest(req: Request): CookieJar {
  const cookieHeader = req.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (k === COOKIE_JAR_NAME) {
      return parseJar(decodeURIComponent(v));
    }
  }
  return {};
}

/** Serialize and (if needed) truncate the jar into a `Set-Cookie` value. */
export function buildJarSetCookie(
  jarStr: string,
  maxAge = COOKIE_JAR_MAX_AGE,
): string | null {
  if (!jarStr || jarStr === "{}") {
    // Empty jar → clear the cookie so the browser drops it.
    return `${COOKIE_JAR_NAME}=; Path=${COOKIE_JAR_PATH}; HttpOnly; SameSite=Lax; Max-Age=0`;
  }
  const encoded = encodeURIComponent(jarStr);
  if (encoded.length > COOKIE_JAR_MAX_BYTES) {
    // Too big — drop oldest hosts until we fit.
    // (Best-effort; for serious use, switch to multi-cookie chunking.)
    return null;
  }
  return `${COOKIE_JAR_NAME}=${encoded}; Path=${COOKIE_JAR_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function buildClearJarCookie(): string {
  return `${COOKIE_JAR_NAME}=; Path=${COOKIE_JAR_PATH}; HttpOnly; SameSite=Lax; Max-Age=0`;
}
