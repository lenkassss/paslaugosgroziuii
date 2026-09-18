/**
 * Worker-safe input sanitising helpers (no jsdom / DOMPurify dependency).
 *
 * All user text is stored as plain text or Markdown and rendered with
 * react-markdown (raw HTML disabled), so the job here is to strip anything
 * that could become executable markup if the content is ever rendered as HTML
 * — script/style/iframe blocks, tags, event handlers and dangerous URL schemes.
 */

const BLOCK_ELEMENTS = /<(script|style|iframe|object|embed|link|meta|svg|math|form)[\s\S]*?(<\/\1\s*>|$)/gi;
const ANY_TAG = /<\/?[a-z][^>]*>/gi;
const EVENT_ATTR = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_SCHEME = /(javascript|vbscript|data)\s*:/gi;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/** Strict plain-text field (names, titles, cities, phones…). */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input
    .replace(BLOCK_ELEMENTS, "")
    .replace(ANY_TAG, "")
    .replace(EVENT_ATTR, "")
    .replace(DANGEROUS_SCHEME, "")
    .replace(CONTROL_CHARS, "")
    .trim()
    .slice(0, maxLength);
}

/** Long-form Markdown body: keeps line breaks, removes markup/executables. */
export function sanitizeRichText(input: unknown, maxLength = 40000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(BLOCK_ELEMENTS, "")
    .replace(ANY_TAG, "")
    .replace(EVENT_ATTR, "")
    .replace(DANGEROUS_SCHEME, "")
    .replace(CONTROL_CHARS, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, maxLength);
}

/** Only http(s) URLs survive; everything else becomes null. */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  const value = input.trim().replace(CONTROL_CHARS, "");
  if (!/^https?:\/\//i.test(value)) return null;
  if (DANGEROUS_SCHEME.test(value)) return null;
  return value.slice(0, 2000);
}

/**
 * Honeypot guard for public forms. A filled hidden field means a bot filled
 * every input on the page — reject the submission.
 */
export function assertNotBot(honeypot?: unknown): void {
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    throw new Error("Užklausa atmesta.");
  }
}

/** Field name shared by client forms and server validators. */
export const HONEYPOT_FIELD = "pg_hp_website";
