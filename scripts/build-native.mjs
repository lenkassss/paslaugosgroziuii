#!/usr/bin/env node
/**
 * Static (client-only) build for the Capacitor native package.
 *
 * Runs the SPA-mode build (vite.native.config.ts), which prerenders a static
 * client shell. The script then:
 *   1. flattens dist/client -> dist   (so Capacitor's webDir "dist" works)
 *   2. drops the server bundle from the native output
 *   3. injects a runtime bridge so every server-function / API request is sent
 *      over the network to the published backend (the app has no local server)
 *   4. writes a 200.html deep-link fallback
 *
 * Usage:
 *   npm run build:native
 *   VITE_BACKEND_ORIGIN=https://your-domain.lt npm run build:native
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const clientDir = path.join(dist, "client");

const BACKEND_ORIGIN = (
  process.env["VITE_BACKEND_ORIGIN"] ||
  process.env["BACKEND_ORIGIN"] ||
  "https://www.testinispuslapis.online"
).replace(/\/+$/, "");

console.log(`\n▸ Native static build — backend: ${BACKEND_ORIGIN}\n`);

fs.rmSync(dist, { recursive: true, force: true });
execSync("npx vite build --config vite.native.config.ts", { stdio: "inherit", cwd: root });

const shell = path.join(clientDir, "index.html");
if (!fs.existsSync(shell)) {
  throw new Error("dist/client/index.html was not produced — SPA shell prerender failed.");
}

// --- flatten dist/client -> dist ------------------------------------------------
for (const entry of fs.readdirSync(clientDir)) {
  const from = path.join(clientDir, entry);
  const to = path.join(dist, entry);
  fs.rmSync(to, { recursive: true, force: true });
  fs.renameSync(from, to);
}
fs.rmSync(clientDir, { recursive: true, force: true });

// --- drop server-only artifacts from the native package ------------------------
for (const junk of ["server", "nitro.json", "_headers", "package.json", "package-lock.json"]) {
  fs.rmSync(path.join(dist, junk), { recursive: true, force: true });
}

// --- runtime bridge: send relative backend calls to the published origin --------
const bridge = `
(function () {
  var ORIGIN = ${JSON.stringify(BACKEND_ORIGIN)};
  window.__BACKEND_ORIGIN__ = ORIGIN;
  var native = location.protocol === "capacitor:" || location.protocol === "file:" ||
    location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "";
  if (!native) return;
  var BACKEND = /^\\/(_serverFn|api)(\\/|$)/;
  var base = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      if (typeof input === "string") {
        var su = new URL(input, location.href);
        if (su.origin === location.origin && BACKEND.test(su.pathname)) {
          input = ORIGIN + su.pathname + su.search;
        }
      } else if (input instanceof URL) {
        if (input.origin === location.origin && BACKEND.test(input.pathname)) {
          input = new URL(ORIGIN + input.pathname + input.search);
        }
      } else if (input && typeof input.url === "string") {
        var ru = new URL(input.url, location.href);
        if (ru.origin === location.origin && BACKEND.test(ru.pathname)) {
          input = new Request(ORIGIN + ru.pathname + ru.search, input);
        }
      }
    } catch (e) {}
    return base(input, init);
  };
})();
`.trim();

let html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
html = html.replace("</head>", `<script>${bridge}</script></head>`);
fs.writeFileSync(path.join(dist, "index.html"), html);
// Deep-link fallback for the native WebView.
fs.writeFileSync(path.join(dist, "200.html"), html);

const assets = fs.readdirSync(path.join(dist, "assets"));
console.log(`\n✔ Native static build ready in dist/`);
console.log(`  dist/index.html + dist/assets (${assets.length} files)`);
console.log(`  server-function calls -> ${BACKEND_ORIGIN}\n`);
