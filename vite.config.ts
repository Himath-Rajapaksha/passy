import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * The production CSP blocks all connections. Vite's dev client needs a
 * same-origin WebSocket for HMR, so relax only connect-src while serving.
 */
function devCsp(): Plugin {
  return {
    name: "passy-dev-csp",
    apply: "serve",
    transformIndexHtml(html) {
      return html.replace(
        "connect-src 'none'",
        "connect-src 'self' ws://127.0.0.1:* ws://localhost:*",
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devCsp()],
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
  },
});
