# Passy v1.0.0

Passy turns a phrase you already remember into a reproducible password that
still looks like that phrase. `blue fox drinks coffee` becomes something like
`blu3-f0x-dR1nk5-coffee`.

Everything runs in your browser. The phrase, site tag, optional secret, and
generated password are never sent, logged, or stored by the app.

> **Memorable is not the same as strong.** A mnemonic password has less entropy
> than a random one. Use Passy's random mode or a password manager for email,
> banking, work SSO, and anything else valuable. Do not reuse the same phrase
> and site tag everywhere.

## What it does

- **Phrase mode (default):** derives a password from your phrase, an optional
  site tag, and an optional extra secret.
  - Same inputs always produce the same password.
  - The site tag makes the same phrase produce a different password per site.
  - Session-random is an advanced option; it adds randomness but cannot be
    reproduced later.
- **Policy enforcement:** default minimum length 16, configurable from 12 to 32,
  maximum output 64 characters. Every output contains lowercase, uppercase, a
  digit, and a symbol.
- **Honest strength meter:** estimates the source phrase with `zxcvbn-ts`, not
  the transformed output. Substitutions and padding add no real entropy.
- **Random fallback:** a CSPRNG mode with a 16–64 length slider (default 20),
  character-class toggles (all on by default), and copy. At least one class
  must stay enabled.
- **Copy and hide:** generated passwords can be copied or masked on screen.

## Privacy and security model

- No analytics, telemetry, third-party scripts, cookies, or storage APIs.
- No `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, or `Math.random` in
  application source. `tests/security/static-guards.test.ts` enforces this.
- No phrase or password is written to storage, URLs, or attributes.
- The only post-load network request is the same-origin lazy chunk for the
  strength estimator. The CSP sets `connect-src 'none'`.
- The meta CSP also sets `default-src 'self'`, `script-src 'self'`,
  `form-action 'none'`, and `base-uri 'none'`. The FastAPI host adds
  `frame-ancestors 'none'` as an HTTP header because browsers ignore it in a
  meta tag.
- Random selection uses Web Crypto (`crypto.getRandomValues`), including
  rejection sampling to avoid modulo bias.
- Web Crypto is required. There is no insecure fallback; browsers without it
  are blocked.
- Memory clearing is best-effort only. JavaScript cannot guarantee that
  immutable strings are erased, and the browser may keep copies. Passy is not
  for shared, compromised, or malware-infected devices.

Passy is not a password manager and does not sync, recover, or store anything.
If you forget a phrase, secret, or setting, the password cannot be recovered.

## How it works

1. The phrase is NFKC-normalized, Latin diacritics are transliterated, control
   and unsupported characters are removed, whitespace is collapsed, and input
   is capped at 256 code points.
2. `passy:v1\0<phrase>\0<site>\0<secret>` is derived with
   PBKDF2-HMAC-SHA-256 at 600,000 iterations into a 32-byte seed.
3. HKDF-SHA-256 with info `passy-map-v1` expands a 4096-byte keystream.
4. A weighted leetspeak substitution keeps the phrase recognizable, spaces map
   to the chosen separator, and safe punctuation is preserved.
5. The result is truncated to 64, padded to the minimum length, repaired to
   include every character class, and validated against the output charset:
   `A-Za-z0-9!@#$%^&*()\-_=+?.`.

The algorithm version `v1` is part of domain separation. v1 constants are
frozen by golden vectors in `tests/core/golden.test.ts`. Any future algorithm
change must add a v2 path and keep v1 reproducible.

## Run locally

Requires Node.js 20.19+ (or 22.12+) and a modern browser with Web Crypto.

```bash
npm install
npm run dev
```

Production build and preview:

```bash
npm run build
npm run preview
```

Web Crypto works on `localhost` and HTTPS. Serve the build over HTTPS (or
localhost) in production.

## Tests

```bash
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
```

- `test:run` covers normalization, derivation, substitution, padding, class
  repair, golden vectors, CSPRNG generation, entropy labels, UI, advanced
  controls, strength messaging, random mode, and static privacy guards.
- `test:e2e` starts the Vite dev server on port 4173 and runs Chromium tests for
  generation, reproducibility after reload, copy, advanced options, random
  mode, 320 px layout, and keyboard flow.
- Playwright uses the installed Google Chrome channel by default. To use
  Playwright's bundled Chromium instead:

  ```bash
  npx playwright install chromium
  PLAYWRIGHT_CHANNEL=chromium npm run test:e2e
  ```

Server tests:

```bash
python3 -m venv --system-site-packages server/.venv
server/.venv/bin/pip install -r server/requirements.txt
server/.venv/bin/python -m pytest -q server
```

## Optional FastAPI host

The FastAPI host is intentionally thin. It serves the built `dist/` directory
at `/` and exposes `GET /healthz` returning `{"status":"ok"}`. It has no
endpoint, request model, or form that accepts a phrase, secret, or password.
Interactive docs and the OpenAPI schema are disabled.

It also sets `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`, and `X-Frame-Options: DENY` on every response.

Run it after building:

```bash
npm run build
cd server
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

Docker:

```bash
docker build -t passy .
docker run --rm -p 8000:8000 passy
curl -s http://127.0.0.1:8000/healthz
```

The Docker image is a multi-stage build: Node builds the static app, then a
non-root Python stage serves it with Uvicorn on port 8000.

## Project layout

```text
src/core/          normalization, derivation, substitution, transform,
                   generation, CSPRNG fallback, entropy wrapper
src/components/    password output, class chips, advanced panel,
                   strength meter, random mode
server/            FastAPI static host and health check
tests/             Vitest unit, UI, and security tests
e2e/               Playwright browser tests
docs/superpowers/  product spec and implementation plan
```

The binding product and security spec is
`docs/superpowers/specs/2026-11-09-mnemonic-password-generator-design.md`.
The implementation plan is
`docs/superpowers/plans/2026-11-09-mnemonic-password-generator.md`.

## Known limitations

- Mnemonic entropy is capped by the source phrase. The strength meter says so.
- Non-Latin scripts are transliterated or stripped in v1.
- Session-random mode loses its output on reload by design.
- The strength estimator is lazy-loaded and adds a large same-origin chunk
  (about 600 KB gzip); it is only loaded when a phrase is typed.
- There is no memory-zeroization guarantee and no protection against a
  compromised browser or device.
