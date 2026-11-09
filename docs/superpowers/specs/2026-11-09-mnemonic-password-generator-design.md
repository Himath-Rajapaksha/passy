# Passy — Mnemonic-Resembling Password Generator

**Product requirements & design document**
**Date:** 2026-11-09
**Status:** Draft for approval
**Working name:** Passy

---

## 1. Summary

Passy turns a phrase the user already remembers into a password that still looks like that phrase. `password` becomes something like `p@$$w0rd-9K#mT7x`; `hello world` becomes something like `h3ll0-w0rld-4Q!z`.

The product is a local-first web app for normal, non-technical users. It is not a password manager, and it is not a replacement for a cryptographically random password on high-value accounts. Its job is to make the “memorable but better than reuse” middle ground safe, honest, and pleasant to use.

This document is the product requirements and design spec for the first release. The main feature is the mnemonic transformation. A small CSPRNG random-password mode is included as a safe fallback.

---

## 2. Problem and intent

Normal users are told to use a unique strong password everywhere. Most generators produce strings like `vN7$kQ2!pL9@xR4#`, which users cannot remember. So they reuse one password, or write it on a note, or pick `Summer2026!`.

A phrase like `blue fox drinks coffee` is easy to remember. It is still weak on its own, but it is much better than reuse, and it can be made to satisfy complexity rules. Passy makes that trade-off explicit instead of pretending the result is random.

**Intent:** give normal users a password they can actually recall, while enforcing baseline complexity and telling the truth about the remaining risk.

---

## 3. Users and scenarios

**Primary user:** a normal, non-technical person signing up for a low- or medium-risk account on a site with irritating password rules. They do not use a password manager, or they use one only for a few important accounts.

**Secondary user:** a tinkerer who likes the mnemonic trick and wants a reproducible password they can derive on any device.

**Representative scenario:**
1. User is creating an account on a hobby forum.
2. The site requires 12+ characters, upper and lower case, a digit, and a symbol.
3. User types `my dog loves bacon`.
4. Passy shows `my-d0g-l0v3$-b@c0n-4Q!z` and confirms all four character classes are present.
5. User copies it, and the site accepts it.
6. Passy warns that this is memorable, not strong, and should not be used for email or banking.

**Explicitly not the target user:** someone securing a bank account, email account, crypto wallet, or work SSO. Those users should use a password manager and a CSPRNG password.

---

## 4. Goals, non-goals, anti-goals

### Goals

- Transform an arbitrary user phrase into a password that visibly resembles the phrase.
- Produce the same output for the same phrase, site tag, settings, and optional secret.
- Enforce a minimum length and the four baseline character classes (lowercase, uppercase, digit, symbol).
- Run entirely in the browser. Never transmit, log, or persist the phrase or the output.
- Be understandable to a non-technical user in under 30 seconds.
- Be accessible and usable on a phone.
- Be honest about entropy. Never label a mnemonic password “strong” when it is not.

### Non-goals

- No account system, vault, sync, cloud storage, or password history.
- No backend endpoint that accepts a phrase or password.
- No browser extension, autofill, or password-manager integration in v1.
- No claim that the output is equivalent to a CSPRNG password.
- No support for non-Latin scripts in v1 beyond safe transliteration and stripping.

### Anti-goals

- A user believing this is safe for their bank because the meter is green.
- A phrase or generated password appearing in logs, analytics, URLs, or storage.
- A deterministic output that silently changes when the app is updated.
- A UI that requires security knowledge to use correctly.
- Complexity for its own sake.

---

## 5. Product decisions

These are the decisions I made from the brief. They are marked so they can be overridden.

| Decision | Choice | Rationale |
|---|---|---|
| **Product shape** | Single-page React web app, static build | The client-side-only constraint makes a data-processing backend impossible by design |
| **Backend** | Optional thin FastAPI host serving `dist/` and `/healthz` | Satisfies a deployable backend without putting user input in the data path |
| **Working name** | Passy | Matches the existing `/home/anorak/Works/passy` directory |
| **Default minimum length** | 16 characters | Comfortably above common 12-character policies without being unwieldy |
| **Maximum output length** | 64 characters | Covers common site limits; longer input is truncated with a notice |
| **Default separator** | `-` | Preserves word boundaries and counts as a symbol |
| **Safe symbol set** | `! @ # $ % ^ & * ( ) - _ = + ? .` | Widely accepted by sites; avoids quotes, backslash, brackets, and whitespace |
| **Character classes** | Lowercase, uppercase, digit, symbol | The common baseline policy |
| **Determinism default** | Reproducible (deterministic) | The point of a mnemonic password is that it can be recalled and re-derived |
| **Extra secret** | Optional advanced field | The only way to add meaningful entropy without storing state |
| **Site tag** | Optional but strongly encouraged field | Same phrase on two sites must not produce the same password |
| **Session-random mode** | Advanced option | Adds real entropy, but output is not reproducible; clearly labeled |
| **Strength estimate** | `zxcvbn-ts` on the source phrase, not the output | The output looks complex but has no independent entropy |
| **Random fallback** | Small CSPRNG mode in the same app | Gives users a safe path for high-value accounts |
| **Memory clearing** | Best-effort only, documented | JavaScript cannot guarantee zeroization of immutable strings |

---

## 6. User experience

### 6.1 Main screen

A single centered card, max width ~640 px, responsive down to 320 px.

**Header**
- `Passy`
- Subtitle: “A password that looks like your phrase.”

**Inputs**
1. **“Phrase you’ll remember”** — required single-line input, `maxlength=256`, autocomplete off, spellcheck off.
2. **“Site or app (recommended)”** — optional single-line input, `maxlength=64`. Helper: “The same phrase gives a different password on each site.”
3. **“Extra secret (optional)”** — password field under “Advanced”, with show/hide. Helper: “One more word only you know. Case and spaces inside it matter. If you forget it, the password changes.”

**Output**
- Large monospace text, wrapping, selectable.
- Copy button.
- A “hide” toggle for shoulder-surfing.
- Empty state: output area blank, copy disabled, helper “Start typing a phrase.”

**Status and safety**
- Four class chips: lowercase, uppercase, digit, symbol. Each turns green when present.
- Length readout: current output length vs. minimum.
- Strength meter based on the source phrase, with an explicit line: “Strength is estimated from your phrase. The substitutions do not add real randomness.”
- Persistent amber note: “Memorable is not the same as strong. Use a password manager for email, banking, and work accounts.”
- If the site tag is empty: “Add a site name so the same phrase doesn’t give the same password everywhere.”

**Advanced panel (collapsed by default)**
- Minimum length slider: 12–32, default 16.
- Separator: `-`, `_`, `.`, or none.
- Mode: Reproducible / Session-random.
- Extra secret field.
- Algorithm version label (read-only): `v1`.

### 6.2 Random fallback mode

A small link or tab: “Need a strong password instead?” Switches to a CSPRNG mode with:
- Length slider 16–64, default 20.
- Character class toggles, all on by default.
- Copy button.
- No phrase input.
- Randomness from `crypto.getRandomValues` with rejection sampling; class inclusion and shuffling use the same CSPRNG. No `Math.random` anywhere.
- At least one character class must stay enabled; the last enabled class cannot be turned off.

This mode is intentionally simple. It exists so a user who is about to secure an important account has an obviously better option in the same app.

### 6.3 Empty and error states

- Empty phrase → empty output, no error, copy disabled.
- Only unsupported characters → empty output, message “No usable characters in that phrase.”
- Input over 256 characters → input is capped; message “Phrase shortened to 256 characters.”
- Output over 64 characters → truncated; message “Output shortened to 64 characters.”
- Empty site tag → generation still works, with the reuse warning.
- Browser or connection lacks Web Crypto (`crypto.subtle`) → blocking message: “This browser or connection can’t run Passy securely. Use a current browser over HTTPS.”

### 6.4 Accessibility

- Every input has a visible label, not placeholder-only.
- Output is announced politely on copy, not on every keystroke.
- Class chips have text labels, not color alone.
- Keyboard order is logical; the advanced panel is a proper disclosure.
- Focus ring visible; contrast meets WCAG AA.
- `prefers-reduced-motion` respected.
- Touch targets at least 44×44 px.

---

## 7. Core algorithm

The core is a pure TypeScript module with no React dependency, so it can be tested and reused.

### 7.1 Pipeline

```
raw input
  → normalize
  → derive seed
  → substitute
  → truncate (if needed)
  → pad (if needed)
  → enforce character classes
  → final validation
  → output
```

### 7.2 Normalization

1. Cap raw input at 256 Unicode code points.
2. Apply Unicode NFKC normalization.
3. Trim leading/trailing whitespace and collapse internal whitespace runs to one space.
4. Transliterate common Latin diacritics to ASCII (`é→e`, `ñ→n`, `ü→u`, `ß→ss`, etc.) using an explicit map.
5. Keep printable ASCII `0x20–0x7E`.
6. Drop control characters, zero-width characters, bidi overrides, emoji, and any remaining non-ASCII code point.
7. Preserve case and digits. Case is part of the mnemonic and affects the output.
8. If the result is empty, stop with an empty output.

Normalization is identical on every platform: explicit maps, `TextEncoder` for UTF-8, no locale-dependent APIs.

**Site tag normalization:** lowercase, trim, collapse whitespace, keep `a–z`, `0–9`, `.`, `-`, `_`; cap at 64 characters. Empty site tag means “not provided.”

**Extra-secret normalization:** apply NFKC, strip control and zero-width characters, trim leading/trailing whitespace, preserve internal whitespace and case, and cap at 128 Unicode code points. The secret is hashed as UTF-8. Internal spaces and case are significant, so the UI must say “Case and spaces inside the secret matter.” An empty secret is allowed. There is no recovery if the secret is forgotten.

### 7.3 Deterministic derivation

**Mode: Reproducible (default)**

```
material = "passy:v1" || 0x00 || normalizedPhrase || 0x00
           || normalizedSite || 0x00 || normalizedSecret

salt     = UTF-8("passy-mnemonic-v1")

seed     = PBKDF2-HMAC-SHA-256(
             password   = material,
             salt       = salt,
             iterations = 600_000,
             length     = 32 bytes
           )
```

**Mode: Session-random**

```
salt = 16 random bytes from crypto.getRandomValues()
seed = PBKDF2-HMAC-SHA-256(material, salt, 600_000, 32 bytes)
```

The random salt is shown to the user only as a “not reproducible” badge. It is not stored. Reloading the page produces a different password.

In reproducible mode the salt is a public domain separator, not a per-user secret. Uniqueness comes from the phrase, site tag, and optional secret. Two users with identical inputs intentionally get identical outputs; the site tag and secret exist to prevent that in normal use.

**Keystream expansion**

```
keystream = HKDF-Expand-SHA-256(
              prk  = seed,
              info = UTF-8("passy-map-v1"),
              length = enough bytes for the normalized phrase, padding, and class repairs
            )
```

All choices below consume bytes from this keystream in order. Bytes are consumed deterministically, so the same seed and normalized phrase produce the same output.

**Why a slow KDF:** the output’s entropy is bounded by the phrase and optional secret. PBKDF2 does not create entropy, but it makes offline guessing of the phrase more expensive. 600,000 iterations is the current OWASP recommendation for PBKDF2-HMAC-SHA-256. It runs asynchronously in Web Crypto and is debounced so typing stays responsive. If the reference devices cannot meet the performance ceiling, reduce the iteration count *before* freezing v1, as specified in §12 and §17. Once v1 ships, the count is frozen; existing outputs must not change silently.

### 7.4 Substitution map

Each source character is mapped to a weighted candidate list. Repeating the original character in the list biases the result toward resemblance.

| Source | Candidates (lowercase) | Notes |
|---|---|---|
| `a` | `a`, `a`, `@`, `4` | |
| `b` | `b`, `b`, `8` | |
| `c` | `c`, `c`, `(` | |
| `e` | `e`, `e`, `3` | |
| `g` | `g`, `g`, `9`, `6` | |
| `i` | `i`, `i`, `!`, `1` | |
| `l` | `l`, `l`, `1` | |
| `o` | `o`, `o`, `0` | |
| `s` | `s`, `s`, `$`, `5` | |
| `t` | `t`, `t`, `7` | |
| `z` | `z`, `z`, `2` | |

Rules:
- Pick one candidate using rejection sampling over the next keystream byte, so every candidate is uniform. Do not use plain modulo, which introduces bias.
- If the source character is uppercase and the chosen candidate is a letter, uppercase it. If the candidate is a digit or symbol, use it as-is.
- Other ASCII letters stay as they are, preserving their case.
- Digits stay as they are.
- A space becomes the selected separator. If the separator is “none”, the space is removed.
- Punctuation already in the safe symbol set is kept.
- Other ASCII punctuation is replaced by a safe symbol chosen from the keystream.
- Unsupported characters were already removed in normalization.

**Resemblance is intentional and is also the weakness.** The output leaks the shape and likely words of the phrase. This is stated in the UI.

### 7.5 Truncation

- If the transformed output is longer than 64 characters, truncate to 64.
- Do not leave a trailing separator.
- Show “Output shortened to 64 characters.”
- Padding and character-class enforcement run after truncation.

### 7.6 Character-class enforcement

After substitution, truncation, and padding, check for lowercase, uppercase, digit, and symbol. Because padding has already brought the output to at least the minimum length (12+), there is always enough room for all four classes.

For each missing class, in this order (lowercase, uppercase, digit, symbol):

1. Find deterministic candidate positions using the next keystream bytes.
2. Prefer the change that preserves resemblance:
   - **Uppercase:** uppercase an existing lowercase letter.
   - **Digit:** replace a letter with its leet digit where possible (`o→0`, `i→1`, `e→3`, `a→4`, `s→5`, `t→7`); otherwise replace a low-value position.
   - **Symbol:** replace a letter with its leet symbol where possible (`a→@`, `s→$`, `i→!`, `c→(`); otherwise replace a low-value position with a safe symbol.
   - **Lowercase:** lowercase an existing uppercase letter; if none, replace a position with a deterministic lowercase letter.
3. Never remove the last remaining member of another required class. If a preferred replacement would do so, take the next deterministic candidate position.
4. If the output is already at the 64-character cap, replace a character rather than inserting one.
5. Re-check all classes after each repair. Stop when all four are present.

The repair is deterministic and consumes the same keystream. The “never remove the last of another class” rule plus the guaranteed minimum length makes termination deterministic and prevents repair cycles.

### 7.7 Padding

If the output is shorter than the minimum length:

1. Append the separator (if any and not already trailing).
2. Append characters from a padding alphabet using the keystream until the minimum length is reached.
3. The padding alphabet includes lowercase, uppercase, digits, and safe symbols, biased toward characters that look intentional rather than random.
4. Do not end with a separator.
5. Skip padding when the output already meets the minimum.

Class enforcement follows padding (see §7.6). Padding runs first so that the output always has enough positions to hold all four classes, even when the source phrase is only one or two characters.

**Honesty:** padding satisfies policy checkers. It does not add entropy, because it is derived from the same seed. The UI must not describe padding as “strengthening” the password.

### 7.8 Final validation

Before returning, assert:

- Output is non-empty when input is non-empty and usable.
- Output length ≥ minimum length.
- Output length ≤ 64.
- Output contains all four classes.
- Output matches `^[A-Za-z0-9!@#$%^&*()\-_=+?.]+$`.
- No whitespace, control characters, or non-ASCII.
- Output is deterministic for the same inputs in reproducible mode.

If any assertion fails, return a safe error state and do not display a password.

### 7.9 Worked examples (illustrative)

Exact outputs depend on the implemented keystream; these show the intended character of the result.

| Phrase | Site | Approx. output |
|---|---|---|
| `password` | `forum` | `p@$$w0rd-9K#mT7x` |
| `hello world` | `shop` | `h3ll0-w0rld-4Q!z` |
| `my dog loves bacon` | `hobby` | `my-d0g-l0v3$-b@c0n-4Q!z` |
| `cat` | `news` | `c@t-7R#pL2x-9K#m` |
| `blue fox drinks coffee` | `mail` | `blu3-f0x-dr1nk$-c0ff33-8N$k` |

The last two are longer than 16 because the transformed phrase is already longer than the minimum. The `password` and `cat` examples are padded to 16. Exact outputs are determined by the keystream and will be captured as golden test vectors.

### 7.10 Versioning and reproducibility contract

- `ALGORITHM_VERSION = "v1"` is part of the domain separation in §7.3.
- Once the first release ships, every v1 constant is frozen: KDF choice, iteration count, salt, domain strings, candidate maps, symbol sets, padding alphabet, and class-repair rules.
- A set of golden vectors (input, site, secret, options → exact output) is committed and run in CI on every supported browser engine.
- A future v2 that changes derivation must keep the v1 code path available and expose a version selector, or it must not ship. A version bump may not silently change passwords that users already rely on.
- v1 has no selector because only v1 exists. The advanced panel shows the read-only version label.
- The TypeScript core must take the algorithm version as a parameter internally, even though v1 is the only value in this release. This avoids a rewrite when v2 arrives.

---

## 8. Security and privacy model

### 8.1 Threat model

Passy assumes:

- The browser and device are not compromised by malware or a keylogger.
- The page is served over HTTPS (or localhost) from a trusted origin.
- The user’s phrase may be weak, reused, or guessable.
- The algorithm is public. Security must not depend on secrecy of the algorithm.

Passy protects against:

- Casual password reuse across sites, when the site tag is used.
- Shoulder surfing, via the hide toggle and no default logging.
- Network exfiltration, via no transmission and a strict CSP.
- Accidental persistence, via no storage APIs.
- Site password-policy rejection, via enforced classes and length.

Passy does **not** protect against:

- A weak or common phrase. The output is only as strong as the phrase plus the optional secret, minus the predictability of the transformation.
- A malicious browser extension, compromised device, or keylogger.
- A site that stores passwords in plaintext or is breached.
- An attacker who knows the phrase, site tag, and settings and runs the same public algorithm.
- Cross-site reuse when the user does not provide a site tag.

### 8.2 Entropy honesty

- Strength is estimated with `zxcvbn-ts` on the normalized source phrase.
- The estimate is capped at the source phrase’s score. Substitutions and padding add no entropy.
- Labels: 0–1 “Very weak — memorable only”; 2 “Weak”; 3 “Okay for low-risk sites”; 4 “Good phrase”.
- A permanent warning is shown in mnemonic mode.
- The random fallback mode is the only mode allowed to display “Strong” based on generated length.

### 8.3 Privacy

- No `fetch`, `XMLHttpRequest`, `sendBeacon`, WebSocket, or third-party requests after the app loads.
- No analytics, telemetry, error reporting, or third-party scripts.
- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or cache writes for phrase/output.
- No phrase or output in URL, title, data attributes, logs, or error messages. The output is rendered only as visible text in its designated element.
- Self-hosted fonts and assets. No CDN dependencies at runtime.
- Production CSP:

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

`style-src 'unsafe-inline'` is a pragmatic allowance for the styling pipeline; scripts remain locked down. If the build can avoid inline styles, tighten it.

### 8.4 Memory handling — explicit limitation

The brief asks to clear input buffers and transformation variables immediately after processing. In a browser this can only be best-effort:

- JavaScript strings are immutable and garbage-collected. The app cannot force a string’s bytes to be overwritten.
- The DOM input element and React state necessarily hold the phrase while the user is typing and while the output updates in real time.
- Web Crypto returns `ArrayBuffer`s that can be overwritten with zeros after use.
- The app can clear React state, refs, and typed arrays on reset, mode switch, and unmount.
- The app can avoid logging and persistence entirely.

**What the app will do:**
- Keep the phrase only in component state and a ref while the page is open.
- Zero `Uint8Array` seed and keystream buffers after generation.
- Clear state and refs on “Clear”, on mode switch, and on unmount.
- Never log, store, or transmit the phrase.
- Avoid copying the phrase into additional strings where practical.

**What the app will not claim:**
- That memory is forensically cleared. A browser cannot guarantee that.

If true zeroization is a hard requirement, the product must be a native app, not a web app. This is a deliberate accepted limitation, not an oversight.

---

## 9. Architecture and stack

### 9.1 Frontend

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Small local UI primitives (button, input, disclosure, tooltip); no heavy component library required
- `zxcvbn-ts` for phrase strength
- Vitest + React Testing Library for unit/component tests
- `fast-check` for property-based tests
- Playwright for E2E

### 9.2 Core module

`src/core/` is pure TypeScript, no React, no DOM:

```
src/core/
  constants.ts      # version, symbol sets, limits, candidate maps
  normalize.ts      # Unicode, diacritics, whitespace, site tag, secret
  derive.ts         # PBKDF2, HKDF, keystream
  transform.ts      # substitution, truncation, class repair, padding
  entropy.ts        # zxcvbn wrapper and labels
  generate.ts       # orchestrates the pipeline
  types.ts          # options, result, error types
```

This separation allows the same logic to be tested directly and, later, reused by a CLI.

### 9.3 Backend (optional)

- FastAPI + Uvicorn
- Serves the built `dist/` as static files
- `GET /healthz` → `{"status":"ok"}`
- Security headers, including CSP
- **No endpoint accepts a phrase, site tag, secret, or password.**
- The backend is a deployment wrapper, not a data processor. If the app is deployed to a static host instead, the backend is omitted with no loss of function.

### 9.4 Repository layout

```
passy/
  docs/superpowers/specs/2026-11-09-mnemonic-password-generator-design.md
  src/
    core/
    components/
    App.tsx
    main.tsx
  tests/
  e2e/
  server/
    main.py
    requirements.txt
  Dockerfile
  index.html
  package.json
  vite.config.ts
  tailwind.config.ts
```

### 9.5 State model

```ts
type Mode = "reproducible" | "session-random";

type GenerateOptions = {
  phrase: string;
  site: string;
  secret: string;
  minLength: number;       // 12..32
  separator: "-" | "_" | "." | "";
  mode: Mode;
};

type GenerateResult =
  | { ok: true; password: string; classes: ClassSet; length: number; notices: Notice[] }
  | { ok: false; reason: "empty" | "no-usable-characters" | "unsupported-browser" | "internal" };
```

No phrase or output is ever written to a store. The result object lives in component memory only.

---

## 10. Edge cases and validation

| Case | Behavior |
|---|---|
| Empty phrase | Empty output, copy disabled, no error |
| Whitespace-only phrase | Treated as empty |
| Phrase with emoji only | Empty output, “No usable characters” |
| Phrase with emoji plus text | Emoji stripped, remaining text transformed, notice with count |
| Accented Latin (`café`) | Transliterated to ASCII (`cafe`) before transform |
| Non-Latin script | Stripped in v1; notice shown |
| Control characters / bidi overrides | Stripped |
| Phrase longer than 256 code points | Capped at 256; notice |
| Output longer than 64 | Truncated to 64; notice |
| Minimum length below 12 | Clamped to 12 |
| Minimum length above 32 | Clamped to 32 |
| All separators / punctuation | Class repair adds required classes |
| Site tag with spaces or emoji | Normalized to `a–z0–9._-`, or empty |
| Secret over 128 code points | Capped at 128; helper text explains |
| Secret forgotten | Output differs; no recovery. Warning shown before use |
| Page reload in reproducible mode | Same output for same inputs |
| Page reload in session-random mode | Different output; badge says not reproducible |
| Web Crypto unavailable | Blocking error; no insecure fallback |
| Very fast typing | Stale derivations are ignored; only the latest result is shown |

---

## 11. Testing strategy

### Unit tests

- Normalization: diacritics, emoji, control chars, bidi, whitespace, empty, 256-char cap, non-Latin.
- Site tag normalization.
- Secret normalization: NFKC, control/zero-width stripping, end trimming, internal spaces and case preserved, 128-code-point cap.
- Candidate selection and case handling.
- Golden vectors for v1 committed and run on Chromium, Firefox, and WebKit via Playwright. The vectors must cover empty secret, unicode secret, long phrase, short phrase, separators, and both modes.
- Determinism: same inputs → same output across runs.
- Site tag changes output.
- Secret changes output.
- Session-random mode changes output across generations.
- Truncation at 64 and no trailing separator.
- Class enforcement for every missing-class combination.
- Padding to minimum length; no trailing separator.
- Output charset and length invariants.
- Empty and no-usable-character results.
- Algorithm version is part of the domain separation.

### Property-based tests (`fast-check`)

- Any usable phrase + valid options → output length between `minLength` and 64.
- Output always contains all four classes.
- Output never contains whitespace, control characters, or non-ASCII.
- Reproducible mode is idempotent.
- Output is stable across `TextEncoder`/`TextDecoder` round trips.
- Truncation never leaves a trailing separator.

### Security tests

- No `fetch`, `XMLHttpRequest`, `sendBeacon`, or WebSocket calls during generation (mock and assert).
- No writes to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
- No `console.*` calls containing phrase or output. A lint rule or test can enforce no console statements in `src/`.
- CSP in the built server blocks `connect-src`.
- Output is rendered as text, never HTML. No `dangerouslySetInnerHTML`.

### Component/E2E tests (Playwright)

- Type a phrase → output updates after debounce.
- Clear the phrase → output clears and copy is disabled.
- Toggle hide/show.
- Copy writes the expected value to the clipboard (with permissions).
- Advanced options change the output deterministically.
- Site tag changes the output.
- Session-random mode shows the “not reproducible” badge and changes on reload.
- Mobile viewport: no horizontal scroll, copy reachable.
- Keyboard-only flow.
- Accessibility: labels, focus order, class chips have text.
- No network request carries phrase or output content; no third-party requests. Same-origin static chunks (for example, a lazy-loaded strength library) are allowed.

### Manual checks

- Chrome, Firefox, Safari (desktop and mobile).
- Low-end phone performance for PBKDF2.
- Screen reader pass on the main flow.
- 200% zoom.

---

## 12. Performance

- “Real-time” means the output updates after a short debounce, not on every keystroke.
- Web Crypto PBKDF2 is asynchronous and does not block the UI. v1 runs it on the main thread; no worker is used, because a worker would create another copy of the phrase via structured clone. If profiling later shows main-thread jank, a worker can be reconsidered with that cost documented.
- Debounce generation by 200 ms after the last keystroke.
- Web Crypto cannot cancel a derivation. Each request carries a generation token; stale results are discarded when they arrive. Only the latest input is ever displayed.
- Show a subtle “deriving…” state while a fresh result is pending. Keep the previous output visible but dimmed until the new one replaces it.
- **Reference devices:** Pixel 6a (or equivalent 2022 mid-range Android) and iPhone SE 2022, current Chrome/Safari. Target: output visible within 1 s of the user stopping typing. Hard ceiling: 1.5 s.
- If the reference devices exceed the hard ceiling, reduce PBKDF2 iterations to no lower than 310,000 *before* freezing v1, and record the final count in the golden vectors and version contract. Do not change iterations after release.
- Core transform is O(n) with n ≤ 256; no performance concern.
- Bundle: lazy-load `zxcvbn-ts` if it materially reduces initial load. The generator must work before the strength meter finishes loading.
- First load target: under 200 KB gzipped for the main app, excluding the lazy strength library.

---

## 13. Deployment

- Static build from Vite.
- Optional FastAPI container:
  - Stage 1: Node build.
  - Stage 2: Python slim, copy `dist/` and `server/`.
  - Run as non-root.
  - `GET /healthz`.
  - Security headers and CSP.
- HTTPS required in production because Web Crypto requires a secure context.
- No environment variables containing secrets are needed. The app has no server-side secrets.
- The app can also be deployed to any static host with the same CSP headers.

---

## 14. Milestones

1. **Core algorithm + tests** — normalization, derivation, substitution, class repair, padding, property tests.
2. **UI shell + live output** — inputs, output, class chips, copy, empty states.
3. **Advanced controls + modes** — length, separator, site tag, secret, session-random, warnings.
4. **Strength meter + random fallback** — zxcvbn integration, CSPRNG mode.
5. **Security hardening** — CSP, no-network tests, memory hygiene, accessibility.
6. **Packaging** — optional FastAPI host, Dockerfile, E2E, browser checks.

No time estimates are implied.

---

## 15. Acceptance criteria

The release is done when:

- Typing a phrase produces a password that visibly resembles it.
- The same phrase + site + settings + secret produces the same password in reproducible mode.
- Changing the site tag changes the password.
- The output always has at least the minimum length and all four character classes.
- The output contains only the allowed ASCII characters.
- Empty input clears the output.
- No network request contains the phrase or output. After load, the only permitted requests are same-origin static assets (for example, a lazy-loaded strength library); no third-party origins are contacted.
- Nothing is written to browser storage or logs.
- The strength meter is honest and never labels a weak source phrase as strong.
- The random fallback mode produces CSPRNG passwords.
- The UI is usable on a 320 px-wide screen and with a keyboard and screen reader.
- The optional FastAPI host serves the app and `/healthz`, and exposes no phrase/password endpoint.
- Unit, property, and E2E tests pass.

---

## 16. Open decisions for the human partner

These are the only points where my call could change what gets built:

1. **Memory clearing:** the brief asks for immediate buffer clearing. A browser app cannot guarantee this for strings. I am proceeding with best-effort clearing and an explicit limitation. If forensic zeroization is required, the product needs to be native, not web.
2. **Deterministic default:** reproducible mode is the default because that is the point of a mnemonic password. If you prefer session-random by default, the product becomes a one-off generator and the mnemonic benefit largely disappears.
3. **Site tag:** included as an optional but strongly encouraged field to prevent cross-site reuse. It is not in the original brief, but without it the same phrase produces the same password everywhere.
4. **Extra secret:** included as an advanced option because it is the only meaningful entropy the user can add. It is optional to keep the main flow simple.
5. **Random fallback:** included as a small secondary mode so users have a safe option for high-value accounts. It can be cut if you want a strictly single-purpose tool.
6. **Backend:** the brief’s client-side-only constraint rules out a data-processing backend. The FastAPI host is optional and only serves static files and health checks. If you expected server-side generation, that would contradict the privacy constraint and needs a decision.

---

## 17. Builder-check resolutions (my calls)

A fresh reviewer read this document and raised five plan-level issues. These are the calls I made; they are part of the spec now.

1. **Version contract:** v1 is frozen with committed golden vectors. A future v2 that changes derivation must keep a v1 code path and expose a selector, or not ship. The core accepts the algorithm version internally even though v1 is the only value now.
2. **Live-update performance:** keep live-as-you-type after a 200 ms debounce. No worker in v1, because a worker adds a structured-clone copy of the phrase. Target ≤ 1 s and hard ceiling 1.5 s on the reference devices. If the ceiling is missed, lower PBKDF2 to no less than 310k *before* freezing v1, then never change it.
3. **Secret normalization:** NFKC, strip control/zero-width characters, trim leading/trailing whitespace, preserve internal whitespace and case, cap at 128 code points. The UI says case and spaces matter.
4. **Uniform selection:** use rejection sampling for candidate selection and for the CSPRNG fallback. Do not use plain modulo, which biases the result.
5. **`l` candidates:** drop `|` because it is outside the safe symbol set and would violate the final output validation.

## 18. What is deliberately left to the builder

- Exact visual design, spacing, color, and typography within the accessibility constraints.
- Component decomposition and state management details.
- Exact wording of helper text, as long as the security meaning is preserved.
- Test file organization.
- Whether to use a web worker for derivation in a later version.
- Whether to add a service worker/PWA in a later version.
- CI configuration and hosting provider.

---

## 19. Future candidates (not in v1)

Research from Reddit threads and security blogs surfaced features that are valuable but out of scope for this release. They are recorded here so the roadmap is informed by that research, not added to v1 by stealth.

- **Passphrase/diceware mode** with the EFF wordlist, separator, capitalization, and number options. This was the most consistently recommended generator feature.
- **Site policy presets** for legacy maximum lengths, bank symbol restrictions, Windows AD policies, and similar real-world rules.
- **Batch generation and export** for onboarding several accounts at once.
- **Optional HaveIBeenPwned k-anonymity breach check.** Opt-in, network-using, and clearly separated from the local-only default.
- **Offline PWA / service worker** so the app opens without a network after first load.
- **QR transfer** of a generated password to a phone.
- **Pronounceable, PIN, WPA, and binary-key modes.**
- **CLI** that shares the same core algorithm and golden vectors.
- **Encrypted local history**, only if explicitly opted in, with a documented change to the threat model.
