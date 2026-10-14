import { NextRequest } from "next/server";
import {
  buildClearJarCookie,
  getJarFromRequest,
  jarHosts,
} from "@/lib/proxy";

// Use Node.js runtime (works on Vercel + Cloudflare Workers via OpenNext).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET /api/proxy/cookies
 * Returns a list of hostnames that currently have cookies stored, with
 * the number of cookies per host (cookie values are never exposed).
 *
 * Example response:
 *   { "hosts": [{ "host": "example.com", "count": 3 }] }
 */
export async function GET(req: NextRequest) {
  const jar = getJarFromRequest(req);
  const hosts = jarHosts(jar);
  return Response.json({ hosts });
}

/**
 * DELETE /api/proxy/cookies
 * Wipes the cookie jar. Returns 204 with a Set-Cookie that immediately
 * expires the jar.
 */
export async function DELETE() {
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": buildClearJarCookie(),
    },
  });
}
