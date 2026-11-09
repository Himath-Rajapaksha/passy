import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const FORBIDDEN: { label: string; pattern: RegExp }[] = [
  { label: "fetch", pattern: /\bfetch\s*\(/ },
  { label: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { label: "sendBeacon", pattern: /\bsendBeacon\b/ },
  { label: "WebSocket", pattern: /\bWebSocket\s*\(/ },
  { label: "localStorage", pattern: /\blocalStorage\b/ },
  { label: "sessionStorage", pattern: /\bsessionStorage\b/ },
  { label: "indexedDB", pattern: /\bindexedDB\b/ },
  { label: "document.cookie", pattern: /document\.cookie/ },
  { label: "Math.random", pattern: /\bMath\.random\s*\(/ },
  { label: "console", pattern: /\bconsole\./ },
  { label: "dangerouslySetInnerHTML", pattern: /dangerouslySetInnerHTML/ },
];

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

it("contains no forbidden privacy or randomness APIs", () => {
  for (const file of files("src")) {
    const text = readFileSync(file, "utf8");
    for (const { label, pattern } of FORBIDDEN) {
      expect(text, `${file} must not use ${label}`).not.toMatch(pattern);
    }
  }
});

it("sets the production CSP and referrer policy", () => {
  const html = readFileSync("index.html", "utf8");
  for (const directive of [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ]) {
    expect(html, `CSP must contain ${directive}`).toContain(directive);
  }
  expect(html).toMatch(/<meta\s+name="referrer"\s+content="no-referrer"/);
});
