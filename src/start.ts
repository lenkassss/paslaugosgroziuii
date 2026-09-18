import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import {
  checkRateLimit,
  clientIp,
  ruleForRequest,
  securityHeaders,
  tooManyRequests,
} from "@/lib/security.server";

const errorMiddleware = createMiddleware().server(async ({ request, next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Native app (Capacitor) support.
 *
 * The native package is a static client build loaded from the local WebView
 * origin, so every server-function / API call is cross-origin against the
 * published backend. Allow those WebView origins explicitly.
 */
const NATIVE_ORIGIN = /^(capacitor|ionic|https?):\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** `file://` pages send `Origin: null`. */
function isNativeOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return origin === "null" || origin === "file://" || NATIVE_ORIGIN.test(origin);
}

function nativeCorsHeaders(origin: string): Record<string, string> {
  const wildcard = origin === "null" || origin === "file://";
  return {
    "access-control-allow-origin": wildcard ? "*" : origin,
    ...(wildcard ? {} : { "access-control-allow-credentials": "true" }),
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers":
      "authorization,content-type,accept,x-tsr-serverfn,x-tsr-redirect,apikey,x-client-info",
    "access-control-expose-headers": "content-type,x-tss-serialized,x-tss-raw-response",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

const nativeCorsMiddleware = createMiddleware().server(async ({ request, next }) => {
  const origin = request?.headers?.get("origin") ?? null;
  const allowed = isNativeOrigin(origin);


  if (allowed && request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: nativeCorsHeaders(origin!) });
  }

  const result = await next();
  if (!allowed) return result;

  const response = result instanceof Response ? result : result?.response;
  if (!(response instanceof Response)) return result;
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(nativeCorsHeaders(origin!))) {
    headers.set(key, value);
  }
  const patched = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  return result instanceof Response ? patched : { ...result, response: patched };
});

/**
 * Zero-trust edge layer: per-IP rate limiting for API / server-function traffic
 * and hardened security headers on every HTML/API response.
 */
const securityMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);

  const isApi =
    url.pathname.startsWith("/api/") ||
    url.searchParams.has("_serverFnId") ||
    request.headers.get("x-tsr-serverfn") != null;

  if (isApi && !url.pathname.startsWith("/api/public/webhooks/")) {
    const rule = ruleForRequest(request, url.pathname);
    const key = `${clientIp(request)}|${rule.limit}|${url.pathname}`;
    const retryAfter = checkRateLimit(key, rule);
    if (retryAfter != null) return tooManyRequests(retryAfter);
  }

  const result = await next();
  const response = result instanceof Response ? result : result?.response;
  if (!(response instanceof Response)) return result;

  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders())) {
    if (!headers.has(key)) headers.set(key, value);
  }
  const patched = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  return result instanceof Response ? patched : { ...result, response: patched };
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [securityMiddleware, nativeCorsMiddleware, errorMiddleware],
}));

