# Passy Web App — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| **Product** | Passy |
| **Release** | v1.0.0 |
| **Document date** | 2026-11-09 |
| **Status** | Core logic and UI complete; Vercel delivery pending |
| **Product scope authority** | This document |
| **Core algorithm authority** | `docs/superpowers/specs/2026-11-09-mnemonic-password-generator-design.md` §7 (frozen v1 contract) |
| **Implementation plan** | `docs/superpowers/plans/2026-11-09-mnemonic-password-generator.md` |
| **Repository** | `/home/anorak/Works/passy` |

**Change-control statement.** This PRD recreates the approved v1 product requirements for Passy as a web app. It preserves the core logic, the feature set, and the scope of the approved design spec. It adds no product features and removes none. The Vercel delivery requirements in §10 are hosting constraints, not new product scope. Any change to the frozen v1 algorithm or the feature set must follow the versioning process in §15.

---

## 1. Summary

Passy turns a phrase the user already remembers into a password that still looks like that phrase. `password` becomes something like `p@$$w0rd-9K#mT7x`; `hello world` becomes something like `h3ll0-w0rld-4Q!z`.

Passy is a local-first, single-page web app for normal, non-technical users. It is not a password manager, and it is not a replacement for a cryptographically random password on high-value accounts. Its job is to make the “memorable but better than reuse” middle ground safe, honest, and pleasant to use.

The main feature is the deterministic mnemonic transformation. A small CSPRNG random-password mode is included as a safe fallback. All derivation runs in the browser; the phrase, site tag, secret, and output never leave the page.

---

## 2. Problem and intent

Normal users are told to use a unique, strong password everywhere. Most generators produce strings such as `vN7$kQ2!pL9@xR4#`, which users cannot remember. So they reuse one password, write it on a note, or pick `Summer2026!`.

A phrase such as `blue fox drinks coffee` is easy to remember. It is still weak on its own, but it is much better than reuse, and it can be made to satisfy complexity rules. Passy makes that trade-off explicit instead of pretending the result is random.

**Intent:** give normal users a password they can actually recall, while enforcing baseline complexity and telling the truth about the remaining risk.

---

## 3. Users and scenarios

| User | Description |
|---|---|
| **Primary** | A normal, non-technical person signing up for a low- or medium-risk account on a site with irritating password rules. They do not use a password manager, or use one only for a few important accounts. |
| **Secondary** | A tinkerer who likes the mnemonic trick and wants a reproducible password they can derive on any device. |
| **Explicitly not the target user** | Someone securing a bank account, email account, crypto wallet, or work SSO. Those users should use a password manager and a CSPRNG password. |

**Representative scenario**

1. The user is creating an account on a hobby forum.
2. The site requires 12+ characters, upper and lower case, a digit, and a symbol.
3. The user types `my dog loves bacon`.
4. Passy shows a result such as `my-d0g-l0v3$-b@c0n-4Q!z` and confirms that all four character classes are present.
5. The user copies it, and the site accepts it.
6. Passy warns that the password is memorable, not strong, and should not be used for email or banking.

---

## 4. Goals, non-goals, and anti-goals

### 4.1 Goals

- Transform an arbitrary user phrase into a password that visibly resembles the phrase.
- Produce the same output for the same phrase, site tag, settings, and optional secret.
- Enforce a minimum length and the four baseline character classes (lowercase, uppercase, digit, symbol).
- Run entirely in the browser. Never transmit, log, or persist the phrase, secret, or output.
- Be understandable to a non-technical user in under 30 seconds.
- Be accessible and usable on a phone.
- Be honest about entropy. Never label a mnemonic password “strong” when it is not.
- Ship as a static web app on Vercel without weakening any privacy guarantee.

### 4.2 Non-goals

- No account system, vault, sync, cloud storage, or password history.
- No backend endpoint that accepts a phrase, site tag, secret, or password.
- No browser extension, autofill, or password-manager integration in v1.
- No claim that the mnemonic output is equivalent to a CSPRNG password.
- No support for non-Latin scripts in v1 beyond safe transliteration and stripping.
- No analytics, telemetry, error reporting, cookies, or third-party runtime scripts.
- No serverless function that processes user input.

### 4.3 Anti-goals

- A user believing this is safe for their bank because the strength meter is green.
- A phrase or generated password appearing in logs, analytics, URLs, or storage.
- A deterministic output that silently changes when the app is updated.
- A UI that requires security knowledge to use correctly.
- Complexity for its own sake.

---

## 5. Product principles

1. **Local-first by construction.** There is no data-processing server to trust. The hosting layer serves bytes only.
2. **Honesty over reassurance.** The strength meter describes the source phrase, and the UI states that substitutions and padding add no real randomness.
3. **Deterministic by default.** Reproducible mode is the default because recall and re-derivation are the point of a mnemonic password.
4. **Policy-compliant output.** Every result meets the configured minimum length and contains all four character classes.
5. **Accessible and calm.** The main flow works with a keyboard, a screen reader, and a 320 px screen.
6. **Frozen v1 contract.** Once released, v1 constants and golden vectors must not change silently.

---

## 6. Scope: v1.0.0 (unchanged)

### 6.1 In scope

| ID | Capability | Notes |
|---|---|---|
| **F-01** | Phrase mode | Deterministic transformation of a remembered phrase. |
| **F-02** | Site tag | Optional but strongly encouraged; separates passwords across sites. |
| **F-03** | Extra secret | Optional advanced field; adds meaningful entropy without storage. |
| **F-04** | Minimum length | Configurable 12–32, default 16. |
| **F-05** | Maximum output | 64 characters, with truncation notice. |
| **F-06** | Separator | `-`, `_`, `.`, or none. |
| **F-07** | Character classes | Lowercase, uppercase, digit, symbol, always present. |
| **F-08** | Session-random mode | Advanced, clearly labeled not reproducible. |
| **F-09** | Strength meter | zxcvbn-ts on the source phrase, honest labels and warning. |
| **F-10** | Random fallback | CSPRNG mode, 16–64 length, character-class toggles. |
| **F-11** | Copy and hide | Copy to clipboard; mask the password on screen. |
| **F-12** | Notices and errors | Empty, unsupported characters, truncation, missing Web Crypto. |
| **F-13** | Accessibility | WCAG 2.1 AA target, keyboard, labels, contrast, reduced motion. |
| **F-14** | Static deployment | Vercel static hosting; optional FastAPI static host kept in parity. |

### 6.2 Out of scope for v1.0.0

- Password manager, vault, sync, history, accounts, or recovery.
- Backend generation, server-side storage, or any API accepting user input.
- Browser extension, autofill, or integration with password managers.
- Breach checks, network lookups, or “Have I Been Pwned” integration.
- Passphrase/diceware mode, policy presets, batch export, QR transfer, CLI, PWA/service worker, or additional generators.
- Non-Latin script support beyond transliteration and stripping.
- Claims of forensic memory zeroization.
- Analytics, session replay, ads, or third-party runtime dependencies.

### 6.3 Scope guardrails

- This PRD is a recreation, not a re-scope. The feature list above is the complete v1.0.0 feature set.
- Helper copy, visual design, component structure, and test organization may vary, provided the security meaning and behavior in this document are preserved.
- Deployment work must not introduce a data-processing function, analytics, or a third-party script. If a hosting feature requires either, it is out of scope.
- Any proposed feature that is not listed in §6.1 belongs in a future release and must not ship in v1.0.0 by stealth.

---

## 7. Functional requirements

Priority: **P0** = release-blocking; **P1** = required for a complete v1.0.0; **P2** = polish that may follow the first deployment without changing the contract.

### 7.1 Phrase mode (FR-P)

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| **FR-P-01** | P0 | The same phrase, site tag, secret, length, separator, and mode must produce the same output in reproducible mode. | Golden vectors and repeat runs produce identical output. |
| **FR-P-02** | P0 | Changing the site tag must change the output for the same phrase and settings. | A test changes only the site tag and asserts a different password. |
| **FR-P-03** | P0 | Changing the optional secret must change the output. | A test changes only the secret and asserts a different password. |
| **FR-P-04** | P0 | The output must be at least the configured minimum length (12–32, default 16). | Length invariant test and UI length readout. |
| **FR-P-05** | P0 | The output must never exceed 64 characters. Longer transformed text is truncated without leaving a trailing separator, with a notice. | Truncation tests assert length 64, no trailing separator, and `output-truncated`. |
| **FR-P-06** | P0 | Every output must contain lowercase, uppercase, digit, and symbol. | Class invariant tests and class chips. |
| **FR-P-07** | P1 | Spaces in the phrase map to the selected separator (`-`, `_`, `.`, or none). | Substitution tests cover all four separators. |
| **FR-P-08** | P1 | Session-random mode must use a fresh random salt and must be labeled not reproducible. | Output differs across generations; warning remains visible outside the collapsed Advanced panel. |
| **FR-P-09** | P1 | Output updates after a 200 ms debounce, not on every keystroke. | UI/E2E timing behavior. |
| **FR-P-10** | P1 | Stale derivations must be discarded; only the latest input may be displayed. | Generation token/ignore logic covered by review and UI behavior. |

### 7.2 Input normalization (FR-N)

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| **FR-N-01** | P0 | Phrase normalization: cap at 256 code points, NFKC, strip combining marks, transliterate common Latin characters, collapse whitespace, keep printable ASCII `0x20–0x7E`, strip control/format/zero-width/bidi/emoji/non-Latin. Preserve case and digits. | `normalize.test.ts` covers diacritics, emoji, bidi, control characters, whitespace, and case. |
| **FR-N-02** | P1 | A phrase longer than 256 code points is capped and reported as shortened. NFKC expansion past the cap also counts as truncation. | Truncation tests, including the NFKC-expansion case. |
| **FR-N-03** | P0 | Site tag normalization: lowercase, trim, collapse whitespace, keep `a–z`, `0–9`, `.`, `-`, `_`; spaces become `-`; cap at 64 code points. | `normalize.test.ts` site tests. |
| **FR-N-04** | P1 | An empty site tag is allowed; the UI shows a reuse warning. | Advanced/UI test and E2E. |
| **FR-N-05** | P0 | Secret normalization: NFKC, strip control and zero-width characters, trim ends, preserve internal case and spaces, cap at 128 code points. | `normalize.test.ts` secret tests. |
| **FR-N-06** | P1 | An empty secret is allowed. Forgetting a non-empty secret changes the password with no recovery. | UI helper text and warning. |
| **FR-N-07** | P0 | An empty or whitespace-only phrase produces an empty output and no error. A phrase with no usable characters produces “No usable characters in that phrase.” | `generate.test.ts` and UI tests. |

### 7.3 Advanced options (FR-O)

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| **FR-O-01** | P1 | Advanced panel is collapsed by default and is a proper disclosure. | Keyboard/UI test. |
| **FR-O-02** | P1 | Minimum-length control offers 12–32 with default 16; out-of-range values clamp. | Clamping test. |
| **FR-O-03** | P1 | Separator control offers `-`, `_`, `.`, and none. | Test asserts option is passed to generation. |
| **FR-O-04** | P1 | Mode control offers Reproducible (default) and Session-random, with the session-random warning and not-reproducible label. | Advanced and E2E tests. |
| **FR-O-05** | P1 | Extra secret field is a password input with show/hide and explains that case and internal spaces matter. | UI test. |
| **FR-O-06** | P2 | Algorithm version shown read-only as `v1`. | UI inspection. |

### 7.4 Output and actions (FR-OUT)

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| **FR-OUT-01** | P0 | Output is rendered as visible, wrapping, selectable monospace text. It must never be rendered as HTML. | No `dangerouslySetInnerHTML`; UI tests. |
| **FR-OUT-02** | P1 | A Copy button writes the current password to the clipboard and announces success politely. | Clipboard tests and E2E copy test. |
| **FR-OUT-03** | P1 | Copy is disabled when there is no password and while a fresh password is deriving. | UI test for the disabled-while-deriving state. |
| **FR-OUT-04** | P1 | A hide/show toggle masks and reveals the password for shoulder-surfing protection. | UI and E2E tests. |
| **FR-OUT-05** | P1 | Empty state shows a blank output, disabled Copy, and the helper “Start typing a phrase.” | UI test. |
| **FR-OUT-06** | P1 | The output area shows current length against the configured minimum. | UI inspection and component test. |

### 7.5 Strength meter (FR-S)

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| **FR-S-01** | P1 | Strength is estimated with `zxcvbn-ts` on the normalized source phrase, never on the transformed output. | `entropy.test.ts` and `strength.test.tsx`. |
| **FR-S-02** | P1 | The estimate is capped by the source phrase’s score; substitutions and padding add no entropy. | Score/label tests. |
| **FR-S-03** | P1 | Labels: 0–1 “Very weak — memorable only”; 2 “Weak”; 3 “Okay for low-risk sites”; 4 “Good phrase”. | `labelForScore` tests. |
| **FR-S-04** | P1 | The mnemonic mode always shows “Memorable is not the same as strong. Use a password manager for email, banking, and work accounts.” The word “Strong” must not describe a mnemonic output. | Persistent-warning test. |
| **FR-S-05** | P2 | The strength library is lazy-loaded and must not block generation. Estimation is debounced by 300 ms, and an unavailable state is shown if it fails. | Lazy chunk and error-state tests. |

### 7.6 Random fallback (FR-R)

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| **FR-R-01** | P1 | Random mode offers a length slider from 16 to 64, default 20. | Random-mode UI tests. |
| **FR-R-02** | P1 | Character-class toggles default to all on. | Random-mode tests. |
| **FR-R-03** | P1 | The last enabled class cannot be disabled; the control disables instead of allowing an empty class set. | Unit and E2E tests. |
| **FR-R-04** | P0 | Randomness comes from `crypto.getRandomValues` with rejection sampling for index selection. `Math.random` is forbidden. | Static guard and random tests. |
| **FR-R-05** | P1 | At least one character from every enabled class is included; shuffling uses the CSPRNG. | Random tests. |
| **FR-R-06** | P1 | Random mode has no phrase input and its own Copy action. | E2E random-mode test. |

### 7.7 Notices, empty states, and errors (FR-E)

| ID | Priority | Requirement |
|---|---|---|
| **FR-E-01** | P0 | Empty phrase → empty output, Copy disabled, no error. |
| **FR-E-02** | P0 | Only unsupported characters → “No usable characters in that phrase.” |
| **FR-E-03** | P1 | Phrase capped at 256 → “Phrase shortened to 256 characters.” |
| **FR-E-04** | P1 | Unsupported characters removed → count and notice. |
| **FR-E-05** | P1 | Output truncated → “Output shortened to 64 characters.” |
| **FR-E-06** | P1 | Empty site tag → generation still works, with the reuse warning. |
| **FR-E-07** | P0 | Web Crypto unavailable → blocking message: “This browser or connection can’t run Passy securely. Use a current browser over HTTPS.” No insecure fallback. |
| **FR-E-08** | P1 | Internal failure → “Something went wrong. No password was generated.” Never show a partial or unvalidated password. |
| **FR-E-09** | P1 | Session-random warning must remain visible after the Advanced panel is collapsed. |

### 7.8 Accessibility (FR-A)

| ID | Priority | Requirement |
|---|---|---|
| **FR-A-01** | P1 | Every input has a visible label, not placeholder-only. |
| **FR-A-02** | P1 | Copy success is announced politely; keystrokes are not announced as output. |
| **FR-A-03** | P1 | Class chips have text labels, not color alone. |
| **FR-A-04** | P1 | Keyboard order is logical; tab switching and the Advanced disclosure work from the keyboard. |
| **FR-A-05** | P1 | Focus rings are visible; text and controls meet WCAG AA contrast. |
| **FR-A-06** | P1 | `prefers-reduced-motion` is respected. |
| **FR-A-07** | P1 | Touch targets are at least 44×44 px. |
| **FR-A-08** | P1 | The layout works at 320 px wide with no horizontal scroll. |

---

## 8. Core logic contract (frozen v1)

The core is a pure TypeScript module with no React or DOM dependency. It must remain reusable and testable. This section restates the frozen contract; §7 of the design spec remains the detailed algorithm authority.

### 8.1 Pipeline

```
raw input
  → normalize phrase, site tag, secret
  → derive 32-byte seed (PBKDF2)
  → expand 4096-byte keystream (HKDF)
  → substitute with weighted candidates
  → truncate to 64 (if needed)
  → pad to minimum length (if needed)
  → enforce character classes
  → final validation
  → output
```

### 8.2 Frozen constants

| Constant | v1.0.0 value |
|---|---|
| Algorithm version | `v1` |
| Minimum length | `12` |
| Default minimum length | `16` |
| Maximum configurable minimum | `32` |
| Maximum output length | `64` |
| Phrase cap | `256` code points |
| Site tag cap | `64` code points |
| Secret cap | `128` code points |
| Safe symbols | `!@#$%^&*()-_=+?.` |
| Output charset | `A-Za-z0-9!@#$%^&*()\-_=+?.` |
| Separators | `-`, `_`, `.`, empty |
| KDF | PBKDF2-HMAC-SHA-256, 600,000 iterations, 32-byte seed |
| Reproducible salt | UTF-8 `passy-mnemonic-v1` |
| HKDF info | UTF-8 `passy-map-v1` |
| Keystream length | 4096 bytes |
| Domain prefix | `passy:v1` followed by NUL separators |
| Padding alphabet | `a–z`, `A–Z`, `0–9`, then safe symbols (minus the active separator) |

### 8.3 Derivation

```
material = "passy:v1" || 0x00 || normalizedPhrase || 0x00
           || normalizedSite || 0x00 || normalizedSecret

reproducible salt = UTF-8("passy-mnemonic-v1")
session-random salt = 16 random bytes from crypto.getRandomValues()

seed = PBKDF2-HMAC-SHA-256(material, salt, 600_000, 32 bytes)
keystream = HKDF-Expand-SHA-256(seed, info=UTF-8("passy-map-v1"), 4096 bytes)
```

The algorithm version is part of domain separation. The TypeScript core accepts the algorithm version internally even though `v1` is the only value in this release.

### 8.4 Substitution, truncation, padding, and repair

**Weighted candidates.** Each source character maps to a candidate list; repeating the original character biases the result toward resemblance.

| Source | Candidates |
|---|---|
| `a` | `a`, `a`, `@`, `4` |
| `b` | `b`, `b`, `8` |
| `c` | `c`, `c`, `(` |
| `e` | `e`, `e`, `3` |
| `g` | `g`, `g`, `9`, `6` |
| `i` | `i`, `i`, `!`, `1` |
| `l` | `l`, `l`, `1` |
| `o` | `o`, `o`, `0` |
| `s` | `s`, `s`, `$`, `5` |
| `t` | `t`, `t`, `7` |
| `z` | `z`, `z`, `2` |

**Substitution rules**

- Select one candidate with rejection sampling over the next keystream byte; never use plain modulo.
- If the source character is uppercase and the chosen candidate is a letter, uppercase it. Digits and symbols are used as-is.
- Other ASCII letters preserve their case; digits stay as they are.
- A space becomes the selected separator; with no separator, the space is removed.
- Safe punctuation is kept; other ASCII punctuation is replaced by a safe symbol from the keystream.
- Unsupported characters were removed during normalization.

**Truncation.** If the transformed output exceeds 64 characters, truncate to 64 and remove a trailing separator. Emit “Output shortened to 64 characters.”

**Padding.** If the output is shorter than the minimum, append the separator (when configured and not already trailing), then append padding characters from the keystream until the minimum is reached. Do not end with a separator. Padding satisfies policy checkers; it does not add entropy.

**Character-class repair.** For each missing class in the order lowercase, uppercase, digit, symbol:

1. Build deterministic candidate positions from the keystream.
2. Prefer resemblance-preserving changes: uppercase an existing lowercase letter; use leet digits (`o→0`, `i→1`, `e→3`, `a→4`, `s→5`, `t→7`); use leet symbols (`a→@`, `s→$`, `i→!`, `c→(`); lowercase an existing uppercase letter.
3. Never remove the last member of another required class.
4. At the 64-character cap, replace a character rather than inserting one.
5. Re-check all classes after each repair and stop when all four are present.

### 8.5 Final validation

Before returning, assert all of the following:

- Output is non-empty when the input is non-empty and usable.
- Output length is between the configured minimum and 64.
- Output contains all four character classes.
- Output matches `^[A-Za-z0-9!@#$%^&*()\-_=+?.]+$`.
- Output contains no whitespace, control characters, or non-ASCII characters.
- Reproducible mode is deterministic for the same inputs.

If any assertion fails, return a safe error state and do not display a password.

### 8.6 Versioning and golden vectors

- Once v1.0.0 ships, every v1 constant is frozen: KDF choice, iteration count, salts, domain strings, candidate maps, symbol sets, padding alphabet, and repair rules.
- Golden vectors are committed and run in CI. Exact v1 vectors are listed in Appendix A.
- A future v2 that changes derivation must keep the v1 code path available and expose a version selector, or it must not ship.
- A version bump may not silently change passwords users already rely on.
- v1 has no selector because only v1 exists; the Advanced panel shows a read-only `v1` label.

---

## 9. Security and privacy requirements

### 9.1 Threat model

**Assumptions**

- The browser and device are not compromised by malware or a keylogger.
- The page is served over HTTPS (or localhost) from a trusted origin.
- The user’s phrase may be weak, reused, or guessable.
- The algorithm is public; security does not depend on its secrecy.

**Passy protects against**

- Casual password reuse across sites when the site tag is used.
- Shoulder surfing, via the hide toggle and no default logging.
- Network exfiltration, via no transmission and a strict CSP.
- Accidental persistence, via no storage APIs.
- Site password-policy rejection, via enforced classes and length.

**Passy does not protect against**

- A weak or common phrase. Output entropy is bounded by the phrase plus optional secret, minus the predictability of the transformation.
- A malicious browser extension, compromised device, or keylogger.
- A site that stores passwords in plaintext or is breached.
- An attacker who knows the phrase, site tag, settings, and secret and runs the same public algorithm.
- Cross-site reuse when the site tag is omitted.

### 9.2 Privacy invariants (P0)

- No `fetch`, `XMLHttpRequest`, `sendBeacon`, WebSocket, or third-party request after load.
- The only permitted post-load requests are same-origin static assets, such as the lazy-loaded strength estimator chunks.
- No analytics, telemetry, error reporting, session replay, or third-party scripts.
- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or cache writes for the phrase or output.
- No phrase, site tag, secret, or output in URLs, titles, data attributes, logs, error messages, or crash reports.
- The output is rendered only as visible text in its designated element, never as HTML.
- Fonts and assets are self-hosted; no CDN dependency at runtime.
- No backend endpoint accepts a phrase, site tag, secret, or password.

### 9.3 Content Security Policy

Production must send this CSP as an HTTP header:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'none';
form-action 'none';
base-uri 'none';
frame-ancestors 'none';
```

`style-src 'unsafe-inline'` is a pragmatic styling allowance; scripts remain locked down. The static HTML meta tag may carry the same directive set except `frame-ancestors`, which browsers ignore in meta tags and which must be sent as an HTTP header by the host.

### 9.4 Memory handling — explicit limitation

Browser memory clearing is best-effort only:

- JavaScript strings are immutable and garbage-collected; the app cannot force their bytes to be overwritten.
- The DOM input and React state necessarily hold the phrase while the user types and while the output updates.
- Web Crypto returns `ArrayBuffer`/`Uint8Array` values that can be zeroed after use.
- The app zeroes the seed and keystream buffers after generation and clears state on explicit clear, mode switch, and unmount where applicable.
- The app never logs, stores, or transmits the phrase.

**The app must not claim forensic zeroization.** If true zeroization is a hard requirement, the product must be a native app, not a web app. This is a deliberate accepted limitation.

### 9.5 Secure context

Web Crypto requires a secure context. Production must use HTTPS; local development may use `localhost`. Browsers without `crypto.subtle` must see the blocking error from FR-E-07 and must not receive an insecure fallback.

---

## 10. Web app delivery on Vercel

Vercel is the primary v1.0.0 delivery target. The app remains a static Vite build; Vercel serves files and headers only. No Vercel function may receive or process user input.

### 10.1 Delivery model (P0)

| ID | Requirement |
|---|---|
| **WD-01** | Deploy the Vite production build (`dist/`) as a static Vercel project. No serverless functions, edge middleware, or API routes. |
| **WD-02** | The deployed app must work from a clean project with `npm ci` and `npm run build` using the pinned lockfile and a pinned Node version. `dist/` must not be committed. |
| **WD-03** | Production and preview deployments must be served over HTTPS. |
| **WD-04** | No Vercel Analytics, Speed Insights, observability scripts, or other injected third-party runtime code may be enabled. |

### 10.2 Security headers (P0)

`vercel.json` (or the equivalent project configuration) must send the following on **every** path, including `/`, `/assets/*`, 404 responses, and preview deployments:

| Header | Value |
|---|---|
| `Content-Security-Policy` | The §9.3 policy, including `frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | At minimum, disable camera, microphone, geolocation, payment, and USB |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (production only) |

Header parity with the optional FastAPI host is required. If both hosts are kept, a CI or post-deploy check must compare their headers.

### 10.3 Caching (P0)

| Asset | Required cache behavior |
|---|---|
| `/assets/*` (content-hashed) | Long-lived immutable caching, e.g. `public, max-age=31536000, immutable` |
| `index.html` | `no-cache` or `no-store, must-revalidate` |
| Any future manifest or service-worker file | `no-cache` (a service worker is out of scope for v1.0.0) |

A stale `index.html` paired with deleted chunk hashes is the expected failure mode if this is wrong. It must not be possible after a redeploy.

### 10.4 Routing (P1)

- No catch-all rewrite to `index.html`. Passy has no client-side routes; unknown paths should return a real 404.
- Static assets must resolve at their hashed paths.
- The CSP and security headers must also apply to the 404 response.

### 10.5 Health check and fallback host (P2)

- `/healthz` today exists only on the optional FastAPI host.
- If uptime monitoring needs a Vercel check, add a static `/healthz.json` asset returning a fixed healthy payload, or drop the endpoint deliberately. Do not add a function.
- The FastAPI host remains an optional parity/fallback deployment. If it is retired, that decision must be recorded in the release notes and README; if it is kept, header-parity checks are mandatory.

### 10.6 Post-deploy verification (P0)

Before calling the deployment done, verify on a preview URL and again on production:

1. `curl -I` against `/`, a hashed asset, and a missing path returns the complete header set.
2. `npm run test:e2e` runs against the deployed build, including the network-egress test, and passes.
3. The browser network panel shows no third-party origins and no request carrying phrase, site tag, secret, or output.
4. Browser storage and cookies remain empty after generating a password.
5. Reproducible mode returns the same password after a reload; session-random mode does not.
6. The build has no Vercel Analytics or Speed Insights script in `index.html`.
7. The cache headers match §10.3 for `index.html` and hashed assets.

---

## 11. Non-functional requirements

### 11.1 Performance (P1)

- Output updates after a 200 ms debounce.
- Target: output visible within 1 second of the user stopping typing; hard ceiling 1.5 seconds on the reference devices (Pixel 6a or equivalent 2022 mid-range Android, iPhone SE 2022, current Chrome/Safari).
- PBKDF2 runs asynchronously via Web Crypto and must not block typing. No worker in v1.
- The main app bundle should stay under 200 KB gzipped, excluding the lazy strength library.
- The generator must work before the strength library finishes loading.

### 11.2 Compatibility (P1)

- Current Chrome, Firefox, Safari, and Edge.
- Web Crypto (`crypto.subtle`) is required; there is no fallback.
- Touch and keyboard input on mobile and desktop.
- No support for Internet Explorer or browsers without Web Crypto.

### 11.3 Accessibility (P1)

- WCAG 2.1 AA target for contrast, focus, labels, and semantics.
- Screen-reader pass on the main flow.
- 200% zoom without loss of function.
- `prefers-reduced-motion` respected.

### 11.4 Reliability and maintainability (P1)

- Core logic is pure TypeScript with no React or DOM dependency.
- Golden vectors and property tests protect the frozen v1 contract.
- Static privacy guards prevent `fetch`, `XMLHttpRequest`, `sendBeacon`, WebSocket, `Math.random`, and storage APIs in application source.
- Any failed validation returns a safe error state, never a partial password.
- Deployment configuration is version-controlled and reviewed like code.

---

## 12. Acceptance criteria

### 12.1 Product and core (AC-P)

| ID | Criterion |
|---|---|
| **AC-P-01** | Typing a phrase produces a password that visibly resembles it. |
| **AC-P-02** | The same phrase + site + settings + secret produces the same password in reproducible mode. |
| **AC-P-03** | Changing the site tag changes the password. |
| **AC-P-04** | Changing the secret changes the password. |
| **AC-P-05** | Every output has at least the configured minimum length and all four character classes. |
| **AC-P-06** | Every output contains only the allowed ASCII characters and no whitespace. |
| **AC-P-07** | Empty input clears the output and disables Copy. |
| **AC-P-08** | Unsupported-only input shows “No usable characters in that phrase.” |
| **AC-P-09** | Session-random mode is labeled not reproducible and changes across generations. |
| **AC-P-10** | The strength meter describes the source phrase and never labels a mnemonic output “Strong.” |
| **AC-P-11** | Random mode produces CSPRNG passwords and cannot disable the last class. |
| **AC-P-12** | The UI is usable at 320 px and with keyboard and screen reader. |

### 12.2 Web delivery (AC-D)

| ID | Criterion |
|---|---|
| **AC-D-01** | A Vercel preview deployment serves the production build over HTTPS. |
| **AC-D-02** | Every path returns the complete security-header set from §10.2. |
| **AC-D-03** | `index.html` is not cached; hashed assets are immutable. |
| **AC-D-04** | Unknown paths return a real 404 with headers, not a rewritten app shell. |
| **AC-D-05** | No analytics, Speed Insights, edge middleware, or serverless function is active. |
| **AC-D-06** | The deployed-build E2E suite passes, including the phrase-egress test. |
| **AC-D-07** | Browser storage and cookies remain empty after generation. |
| **AC-D-08** | Reproducibility survives a production reload; session-random mode does not. |
| **AC-D-09** | The FastAPI fallback, if retained, matches the Vercel headers. |
| **AC-D-10** | A rollback procedure is documented (redeploy the previous Vercel deployment). |

---

## 13. Success metrics and definition of done

**A new user can generate and copy a policy-compliant password in under 30 seconds without reading documentation.**

v1.0.0 is done when:

- All AC-P criteria pass in the automated suite.
- All AC-D criteria pass on a preview deployment and on production.
- Unit, property, security, and E2E tests pass.
- The deployed build makes zero third-party requests and carries no user input in any request.
- The privacy model and best-effort memory limitation are documented in the UI and README.
- Golden vectors are committed and reproduce exactly.
- The deployment can be rolled back to the previous Vercel deployment without a data migration.

**Current status:** AC-P is implemented and verified locally. AC-D is pending; Vercel has not yet been configured or deployed.

---

## 14. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Weak phrase mistaken for strong | Account compromise | Honest strength meter, persistent warning, random fallback, explicit anti-user guidance. |
| Forgotten secret or site tag | Password cannot be re-derived | UI explains that case and spaces matter and that there is no recovery. |
| Stale `index.html` after deploy | White screen or broken chunks | `no-cache` for HTML, immutable hashed assets, post-deploy smoke test. |
| Header drift between hosts | Privacy regression | Single header spec, `vercel.json` parity test, deployed `curl -I` checks. |
| Third-party script injected by host | Phrase could leave the page | No analytics/Speed Insights, CSP, network-egress E2E, built-HTML diff. |
| Browser lacks Web Crypto | App does not work | Blocking message; no insecure fallback; HTTPS required. |
| Memory cannot be zeroized | Residual copies in memory | Best-effort clearing, documented limitation, no logs or storage. |
| PBKDF2 too slow on low-end phones | Typing feels broken | 200 ms debounce, async Web Crypto, 1.5 s ceiling; iteration reduction only before v1 freeze. |
| Non-Latin phrase stripped | Unexpected empty output | Notice and guidance; v1 limitation documented. |
| Cross-browser drift | Different golden vectors | Cross-engine CI when browser downloads are available; Chrome is the current environment fallback. |

---

## 15. Release and change control

### 15.1 v1.0.0 freeze

- The algorithm version, KDF parameters, salts, domain strings, candidate maps, symbol sets, padding alphabet, and repair rules are frozen at release.
- Golden vectors are the regression contract. If a vector changes, the release is wrong, not the test.
- Deployment configuration changes (headers, caching, host) are allowed only if they preserve §9 and §10.

### 15.2 Future versions

- Any algorithm change requires a new version (`v2`) with a preserved `v1` path and a version selector, or it must not ship.
- New product features belong in a future PRD revision and must not be added to v1.0.0 by stealth.
- A UI or copy change is allowed when it preserves the security meaning and acceptance criteria.

### 15.3 Documentation

- This PRD is the product-scope authority.
- The design spec remains the detailed algorithm authority.
- The README must link both and state the current deployment status.

---

## 16. Traceability matrix

| Requirement area | Implementation | Primary tests |
|---|---|---|
| Phrase mode, determinism, site/secret separation | `src/core/generate.ts`, `src/core/derive.ts` | `tests/core/golden.test.ts`, `tests/core/generate.test.ts` |
| Normalization (`FR-N`) | `src/core/normalize.ts` | `tests/core/normalize.test.ts` |
| Substitution (`FR-P-07`, `FR-N`) | `src/core/substitute.ts` | `tests/core/substitute.test.ts` |
| Truncation, padding, class repair (`FR-P-04`–`FR-P-06`) | `src/core/transform.ts` | `tests/core/transform.test.ts`, property tests |
| CSPRNG fallback (`FR-R`) | `src/core/random.ts`, `src/components/RandomMode.tsx` | `tests/core/random.test.ts`, `tests/ui/random-mode.test.tsx`, E2E |
| Strength meter (`FR-S`) | `src/core/entropy.ts`, `src/components/StrengthMeter.tsx` | `tests/core/entropy.test.ts`, `tests/ui/strength.test.tsx` |
| Output, copy, hide (`FR-OUT`) | `src/components/PasswordOutput.tsx`, `src/App.tsx` | `tests/ui/app.test.tsx`, E2E |
| Advanced options and modes (`FR-O`) | `src/components/AdvancedPanel.tsx` | `tests/ui/advanced.test.tsx`, E2E |
| Privacy guards (`§9.2`) | `src/`, `index.html`, `tests/security/static-guards.test.ts` | Static guards and E2E network-egress test |
| Static host headers (`§9.3`, `§10.2`) | `server/main.py`; `vercel.json` pending | `server/test_main.py`, `curl -I` checks pending |
| Deployment (`§10`) | Vercel project configuration (pending) | AC-D checks (pending) |

---

## Appendix A — Frozen v1 golden vectors

All vectors use `minLength: 16`, `separator: "-"`, `mode: "reproducible"`, and 600,000 PBKDF2 iterations.

| Phrase | Site | Secret | Expected output |
|---|---|---|---|
| `password` | `forum` | — | `p@55w0rd-4$$G6k2` |
| `hello world` | `shop` | — | `he110-w0rld-dE)d` |
| `cat` | `news` | — | `c@7-nGIIImS@RzBn` |
| `blue fox drinks coffee` | `mail` | — | `blu3-f0x-dR1nk5-coffee` |
| `password` | `forum` | `Blue Fox` | `p45sword-=uMvdHB` |

These values are enforced by `tests/core/golden.test.ts`. They must not change in v1.0.0.

---

## Appendix B — Current verification evidence (2026-11-09)

The following were run on branch `feat/v1.0.0` after the final review fixes:

| Check | Command | Result |
|---|---|---|
| Type check | `npm run typecheck` | Passed |
| Unit/component/security tests | `npm run test:run` | 14 files, 82 tests passed |
| Production build | `npm run build` | Passed |
| Browser E2E | `npm run test:e2e` | 9 passed (system Google Chrome) |
| FastAPI host tests | `server/.venv/bin/python -m pytest -q server` | 5 passed |
| Golden vectors | `tests/core/golden.test.ts` | 5/5 passed |

Known environment limitation: Playwright browser downloads are blocked here, so E2E and golden-vector browser coverage currently use system Chrome. Firefox/WebKit coverage remains a release follow-up. Vercel deployment and deployed-header verification have not yet been performed.

---

## Appendix C — Glossary

| Term | Meaning |
|---|---|
| **Mnemonic password** | A password derived from a memorable phrase, intentionally resembling it. |
| **Reproducible mode** | Deterministic derivation: the same inputs always produce the same output. |
| **Session-random mode** | Advanced mode with a random salt; output cannot be re-derived after reload. |
| **Site tag** | Optional per-site input that separates passwords for the same phrase. |
| **Extra secret** | Optional user-only phrase that adds entropy; case and internal spaces matter. |
| **Keystream** | Deterministic bytes from HKDF used for all selection and repair choices. |
| **Class repair** | Deterministic replacement to guarantee lowercase, uppercase, digit, and symbol. |
| **Golden vector** | A frozen input/output pair that protects the v1 contract. |
| **CSPRNG** | Cryptographically secure pseudorandom number generator, here Web Crypto. |
| **Best-effort clearing** | Zeroing typed arrays where possible without claiming forensic erasure. |
