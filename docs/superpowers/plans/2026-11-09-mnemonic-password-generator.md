# Passy v1.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a local-first React/TypeScript web app that turns a remembered phrase into a reproducible, policy-compliant password that resembles the phrase, with honest entropy messaging and a CSPRNG fallback.

**Architecture:** A pure TypeScript core (`src/core/`) handles normalization, PBKDF2/HKDF derivation, leetspeak substitution, padding, class repair, validation, and CSPRNG generation. React components render a single-page UI and never persist or transmit the phrase. An optional FastAPI host serves the static build and `/healthz` only.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS 4, Vitest, React Testing Library, fast-check, Playwright, zxcvbn-ts, FastAPI.

**Spec:** `docs/superpowers/specs/2026-11-09-mnemonic-password-generator-design.md`

## Global Constraints

- The phrase, site tag, secret, and output must never be sent over the network, written to storage, logged, or placed in URLs/attributes.
- PBKDF2-HMAC-SHA-256, 600,000 iterations, 32-byte seed; HKDF-SHA-256 with info `passy-map-v1`.
- `ALGORITHM_VERSION = "v1"` is part of domain separation. Freeze all v1 constants after release.
- Default minimum length 16; allowed range 12–32; maximum output 64 characters; phrase cap 256 Unicode code points; site cap 64; secret cap 128.
- Output charset: `A-Za-z0-9!@#$%^&*()\-_=+?.` and it must contain lowercase, uppercase, digit, and symbol.
- Safe symbol set: `!@#$%^&*()-_=+?.`
- Reproducible mode is the default. Session-random is an advanced option and must be labeled not reproducible.
- Use `crypto.getRandomValues` / Web Crypto only. Never `Math.random`.
- No third-party runtime scripts, analytics, cookies, or storage APIs for phrase/output.
- Production CSP: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'`.
- Live output updates after a 200 ms debounce; target ≤1 s, hard ceiling 1.5 s on Pixel 6a / iPhone SE 2022.
- WCAG AA contrast, visible labels, keyboard access, 44 px touch targets, 320 px minimum width.

## Review Focus

1. **Unicode, emoji, control, and bidi input** — must be transliterated or stripped without crashing and without leaking invalid characters into the password.
2. **One-character or punctuation-only phrases** — padding and class repair must still produce a valid 12+ character password with all four classes.
3. **Overlong phrases and outputs** — truncation at 64 must not leave a trailing separator or lose a required class.
4. **Secrets with case, spaces, and Unicode** — normalization must be stable across calls and changing the secret must change the output.
5. **Fast typing with async PBKDF2** — stale derivations must never overwrite the latest result.

---

### Task 1: Scaffold the app and test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`
- Create: `tests/setup.ts`, `tests/ui/smoke.test.tsx`
- Create: `.gitignore`, `README.md` (placeholder)

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm run test:run`, `npm run typecheck`, `npm run test:e2e`.
- Produces: Vitest config with default `node` environment and `jsdom` only for `tests/ui/**`.

- [ ] **Step 1: Create the package and tooling files**

Use these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Dependencies: `react`, `react-dom`, `@zxcvbn-ts/core`, `@zxcvbn-ts/language-common`, `@zxcvbn-ts/language-en`.
Dev dependencies: `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`, `@playwright/test`, `@types/react`, `@types/react-dom`.

- [ ] **Step 2: Write the failing smoke test**

```tsx
// tests/ui/smoke.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import App from "../../src/App";

it("renders the Passy heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /passy/i })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run it and verify it fails**

Run: `npm run test:run -- tests/ui/smoke.test.tsx`
Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 4: Create the minimal App and entry point**

`App.tsx` returns `<main><h1>Passy</h1></main>`. `main.tsx` mounts it. `index.css` imports Tailwind 4 with `@import "tailwindcss";`.

- [ ] **Step 5: Run the smoke test and build**

Run: `npm run test:run -- tests/ui/smoke.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 6: Initialize git and commit**

```bash
git init
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts index.html src tests .gitignore
git commit -m "chore: scaffold Passy app and test harness"
```

---

### Task 2: Core constants, types, and normalization

**Files:**
- Create: `src/core/constants.ts`, `src/core/types.ts`, `src/core/normalize.ts`
- Create: `tests/core/normalize.test.ts`

**Interfaces:**
- Produces: `ALGORITHM_VERSION`, `MIN_LENGTH`, `MAX_MIN_LENGTH`, `MAX_OUTPUT_LENGTH`, `MAX_PHRASE_CODE_POINTS`, `MAX_SITE_CODE_POINTS`, `MAX_SECRET_CODE_POINTS`, `SAFE_SYMBOLS`.
- Produces: `GenerateOptions`, `GenerateResult`, `Notice`, `ClassSet`, `Separator`, `Mode`.
- Produces: `normalizePhrase(raw: string): { value: string; removed: number; truncated: boolean }`
- Produces: `normalizeSite(raw: string): string`
- Produces: `normalizeSecret(raw: string): string`

- [ ] **Step 1: Write failing normalization tests**

```ts
// tests/core/normalize.test.ts
import { describe, expect, it } from "vitest";
import { normalizePhrase, normalizeSecret, normalizeSite } from "../../src/core/normalize";

describe("normalizePhrase", () => {
  it("returns empty for whitespace-only input", () => {
    expect(normalizePhrase("   \t\n  ").value).toBe("");
  });
  it("transliterates Latin diacritics", () => {
    expect(normalizePhrase("café naïve Straße").value).toBe("cafe naive Strasse");
  });
  it("strips emoji, control, bidi, and non-Latin characters", () => {
    expect(normalizePhrase("hi 😀 \u202E 世界").value).toBe("hi");
    expect(normalizePhrase("hi 😀").removed).toBe(1);
  });
  it("collapses whitespace and preserves case", () => {
    expect(normalizePhrase("  Blue   Fox  ").value).toBe("Blue Fox");
  });
  it("caps at 256 code points", () => {
    const result = normalizePhrase("a".repeat(300));
    expect(Array.from(result.value)).toHaveLength(256);
    expect(result.truncated).toBe(true);
  });
});

describe("normalizeSite", () => {
  it("lowercases and slugifies", () => {
    expect(normalizeSite(" My Site! ")).toBe("my-site");
  });
  it("caps at 64 code points", () => {
    expect(Array.from(normalizeSite("a".repeat(100)))).toHaveLength(64);
  });
});

describe("normalizeSecret", () => {
  it("trims ends but preserves internal case and spaces", () => {
    expect(normalizeSecret("  Blue Fox  ")).toBe("Blue Fox");
  });
  it("strips control and zero-width characters", () => {
    expect(normalizeSecret("a\u200Bb\u0000c")).toBe("abc");
  });
  it("caps at 128 code points", () => {
    expect(Array.from(normalizeSecret("ü".repeat(200)))).toHaveLength(128);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- tests/core/normalize.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement constants, types, and normalization**

Normalization order: cap code points, NFKC, NFD + strip combining marks, explicit special map (`ß→ss`, `ø→o`, `æ→ae`, `œ→oe`, `ł→l`, `đ→d`, `þ→th`), trim/collapse whitespace, strip control/zero-width/bidi, keep printable ASCII, count removed, clamp cap. Site uses the same Unicode cleanup then lowercase, whitespace→`-`, keep `a-z0-9._-`, cap 64. Secret uses NFKC, strip control/zero-width, trim ends, preserve internal whitespace/case, cap 128.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/core/normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/constants.ts src/core/types.ts src/core/normalize.ts tests/core/normalize.test.ts
git commit -m "feat(core): add normalization and shared types"
```

---

### Task 3: PBKDF2, HKDF, and byte stream

**Files:**
- Create: `src/core/derive.ts`, `src/core/byteStream.ts`
- Create: `tests/core/derive.test.ts`

**Interfaces:**
- Produces: `deriveSeed(material: string, salt: Uint8Array, iterations?: number): Promise<Uint8Array>`
- Produces: `expandKeystream(seed: Uint8Array, length: number): Promise<Uint8Array>`
- Produces: `randomBytes(length: number): Uint8Array`
- Produces: `zeroBytes(bytes: Uint8Array): void`
- Produces: `ByteStream` with `nextByte(): number`, `nextIndex(bound: number): number`, `remaining(): number`.

- [ ] **Step 1: Write failing derivation tests**

```ts
import { describe, expect, it } from "vitest";
import { deriveSeed, expandKeystream, randomBytes, zeroBytes } from "../../src/core/derive";
import { ByteStream } from "../../src/core/byteStream";

it("derives the same seed for the same material", async () => {
  const a = await deriveSeed("password\0forum\0", new TextEncoder().encode("salt"), 1000);
  const b = await deriveSeed("password\0forum\0", new TextEncoder().encode("salt"), 1000);
  expect(Array.from(a)).toEqual(Array.from(b));
});
it("changes the seed when material changes", async () => {
  const a = await deriveSeed("one", new TextEncoder().encode("salt"), 1000);
  const b = await deriveSeed("two", new TextEncoder().encode("salt"), 1000);
  expect(Array.from(a)).not.toEqual(Array.from(b));
});
it("expands a deterministic keystream of the requested length", async () => {
  const seed = new Uint8Array(32).fill(7);
  const a = await expandKeystream(seed, 64);
  const b = await expandKeystream(seed, 64);
  expect(a).toHaveLength(64);
  expect(Array.from(a)).toEqual(Array.from(b));
});
it("draws unbiased indexes with rejection sampling", () => {
  const stream = new ByteStream(new Uint8Array([255, 0, 1, 2, 3]));
  expect(stream.nextIndex(4)).toBe(0);
  expect(stream.nextIndex(4)).toBe(1);
});
it("zeroes a buffer", () => {
  const bytes = new Uint8Array([1, 2, 3]);
  zeroBytes(bytes);
  expect(Array.from(bytes)).toEqual([0, 0, 0]);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/core/derive.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement derivation and stream**

Use `crypto.subtle.importKey("raw", TextEncoder.encode(material), "PBKDF2", false, ["deriveBits"])` and `deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256)`. HKDF uses the seed as key material, empty salt, info `TextEncoder.encode("passy-map-v1")`, and `length * 8` bits; reject lengths above 8160 bytes. `ByteStream.nextIndex(bound)` rejects bytes ≥ `256 - (256 % bound)`.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/core/derive.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/derive.ts src/core/byteStream.ts tests/core/derive.test.ts
git commit -m "feat(core): add PBKDF2/HKDF derivation and byte stream"
```

---

### Task 4: Leetspeak substitution

**Files:**
- Create: `src/core/substitute.ts`
- Create: `tests/core/substitute.test.ts`

**Interfaces:**
- Consumes: `ByteStream`, `SAFE_SYMBOLS`, `Separator`.
- Produces: `substitute(phrase: string, separator: Separator, bytes: Uint8Array): string`
- Produces: `CANDIDATE_MAP` in `src/core/constants.ts`.

- [ ] **Step 1: Write failing substitution tests**

```ts
import { describe, expect, it } from "vitest";
import { substitute } from "../../src/core/substitute";

it("keeps the original character when the stream selects it", () => {
  expect(substitute("a", "-", new Uint8Array([0, 0]))).toBe("a");
});
it("applies a leet candidate when selected", () => {
  expect(substitute("a", "-", new Uint8Array([3, 0]))).toBe("4");
});
it("preserves uppercase on letters", () => {
  expect(substitute("A", "-", new Uint8Array([3, 0]))).toBe("4");
  expect(substitute("E", "-", new Uint8Array([2, 0]))).toBe("3");
});
it("maps spaces to the chosen separator or removes them", () => {
  expect(substitute("a b", "-", new Uint8Array([0, 0, 0]))).toBe("a-b");
  expect(substitute("a b", "", new Uint8Array([0, 0, 0]))).toBe("ab");
});
it("keeps safe punctuation and replaces unsafe punctuation", () => {
  const out = substitute("a?b\\c", "-", new Uint8Array([0, 0, 0, 0, 0]));
  expect(out).toMatch(/^[A-Za-z0-9!@#$%^&*()\-_=+?.]+$/);
  expect(out.startsWith("a?b")).toBe(true);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/core/substitute.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement substitution**

Map `a,b,c,e,g,i,l,o,s,t,z` to weighted candidate lists from the spec. Consume one byte per mapped character; if the source is uppercase, uppercase letter candidates. Keep other ASCII letters, digits, and safe symbols. Replace unsafe punctuation and unsupported characters with a safe symbol drawn from the stream. Spaces become the separator.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/core/substitute.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/constants.ts src/core/substitute.ts tests/core/substitute.test.ts
git commit -m "feat(core): add leetspeak substitution"
```

---

### Task 5: Truncation, padding, class repair, validation

**Files:**
- Create: `src/core/transform.ts`
- Create: `tests/core/transform.test.ts`

**Interfaces:**
- Consumes: `ByteStream`, `GenerateOptions`, `SAFE_SYMBOLS`.
- Produces: `transformFromBytes(normalizedPhrase: string, options: GenerateOptions, bytes: Uint8Array): { password: string; notices: Notice[] }`
- Produces: `hasAllClasses(value: string): boolean`
- Produces: `isValidOutput(value: string, minLength: number): boolean`

- [ ] **Step 1: Write failing transform tests**

```ts
import { describe, expect, it } from "vitest";
import { transformFromBytes, isValidOutput } from "../../src/core/transform";
import type { GenerateOptions } from "../../src/core/types";

const base: GenerateOptions = {
  phrase: "x", site: "", secret: "", minLength: 16, separator: "-", mode: "reproducible",
};

it("truncates to 64 without a trailing separator", () => {
  const out = transformFromBytes("a".repeat(100), base, new Uint8Array(4096).fill(1));
  expect(out.password.length).toBeLessThanOrEqual(64);
  expect(out.password.endsWith("-")).toBe(false);
  expect(isValidOutput(out.password, 16)).toBe(true);
});
it("pads one-character input to the minimum and adds all classes", () => {
  const out = transformFromBytes("x", base, new Uint8Array(4096).fill(2));
  expect(out.password.length).toBeGreaterThanOrEqual(16);
  expect(isValidOutput(out.password, 16)).toBe(true);
});
it("repairs a lowercase-only input", () => {
  const out = transformFromBytes("abcdef", base, new Uint8Array(4096).fill(5));
  expect(out.password).toMatch(/[A-Z]/);
  expect(out.password).toMatch(/[0-9]/);
  expect(out.password).toMatch(/[!@#$%^&*()\-_=+?.]/);
});
it("never leaves the last member of another class when repairing", () => {
  const out = transformFromBytes("A1!", base, new Uint8Array(4096).fill(9));
  expect(isValidOutput(out.password, 16)).toBe(true);
});
it("rejects invalid outputs", () => {
  expect(isValidOutput("short", 16)).toBe(false);
  expect(isValidOutput("abcdefghijklmnop", 16)).toBe(false);
  expect(isValidOutput("Abcdefghijklmno1", 16)).toBe(false);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/core/transform.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the transform pipeline**

Order: substitute → truncate to 64 (remove trailing separator) → pad to `minLength` with a keystream alphabet (no trailing separator) → enforce classes in order lowercase, uppercase, digit, symbol. Class repair builds all valid single-character replacements, filters out any that would remove the last member of another present class, prefers leet replacements, then selects one with `ByteStream.nextIndex`. For insertion, replace rather than insert at the 64 cap. Validate with `^[A-Za-z0-9!@#$%^&*()\-_=+?.]+$`, length, and classes. Throw `Error("internal")` if repair cannot converge.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/core/transform.test.ts`
Expected: PASS.

- [ ] **Step 5: Add property tests**

```ts
import fc from "fast-check";
it("always produces a valid output for printable input", () => {
  fc.assert(fc.property(
    fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !?@#".split("")), { minLength: 1, maxLength: 40 }),
    fc.uint8Array({ minLength: 4096, maxLength: 4096 }),
    (phrase, bytes) => isValidOutput(transformFromBytes(phrase, base, bytes).password, 16)
  ));
});
```

Run: `npm run test:run -- tests/core/transform.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/transform.ts tests/core/transform.test.ts
git commit -m "feat(core): add padding, class repair, and validation"
```

---

### Task 6: Generate orchestrator, session mode, and golden vectors

**Files:**
- Create: `src/core/generate.ts`
- Create: `tests/core/generate.test.ts`, `tests/core/golden.test.ts`
- Create: `scripts/print-golden.ts` (temporary; keep it as a documented vector generator)

**Interfaces:**
- Consumes: normalization, derivation, transform.
- Produces: `generatePassword(options: GenerateOptions): Promise<GenerateResult>`
- Produces: `buildMaterial(normalizedPhrase: string, normalizedSite: string, normalizedSecret: string): string`
- Produces: `computeOutput(options: GenerateOptions, iterations?: number): Promise<GenerateResult>` for tests.

- [ ] **Step 1: Write failing orchestration tests**

```ts
it("returns empty for an empty phrase", async () => {
  const result = await generatePassword({ ...base, phrase: "   " });
  expect(result).toEqual({ ok: false, reason: "empty" });
});
it("returns no-usable-characters for emoji only", async () => {
  const result = await generatePassword({ ...base, phrase: "😀😀" });
  expect(result).toEqual({ ok: false, reason: "no-usable-characters" });
});
it("is deterministic for the same inputs", async () => {
  const a = await computeOutput({ ...base, phrase: "password", site: "forum" }, 1000);
  const b = await computeOutput({ ...base, phrase: "password", site: "forum" }, 1000);
  expect(a).toEqual(b);
});
it("changes output when the site changes", async () => {
  const a = await computeOutput({ ...base, phrase: "password", site: "forum" }, 1000);
  const b = await computeOutput({ ...base, phrase: "password", site: "shop" }, 1000);
  expect(a.ok && b.ok && a.password).not.toBe(b.password);
});
it("changes output when the secret changes", async () => {
  const a = await computeOutput({ ...base, phrase: "password", secret: "a" }, 1000);
  const b = await computeOutput({ ...base, phrase: "password", secret: "b" }, 1000);
  expect(a.ok && b.ok && a.password).not.toBe(b.password);
});
it("produces different output in session-random mode", async () => {
  const a = await generatePassword({ ...base, phrase: "password", mode: "session-random" });
  const b = await generatePassword({ ...base, phrase: "password", mode: "session-random" });
  expect(a.ok && b.ok && a.password).not.toBe(b.password);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/core/generate.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the orchestrator**

`buildMaterial` returns `"passy:v1\0" + phrase + "\0" + site + "\0" + secret`. Reproducible salt is `TextEncoder.encode("passy-mnemonic-v1")`. Session-random uses `randomBytes(16)`. Derive 32 bytes, expand 4096 keystream bytes, call `transformFromBytes`. Zero the seed and keystream in `finally`. Map normalization notices. Do not log.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/core/generate.test.ts`
Expected: PASS.

- [ ] **Step 5: Generate and commit golden vectors**

Run: `npx tsx scripts/print-golden.ts` (install `tsx` as a dev dependency or use `vite-node`).
Capture five outputs for: `password/forum`, `hello world/shop`, `cat/news`, `blue fox drinks coffee/mail`, and `password/forum` with secret `Blue Fox`. Write them into `tests/core/golden.test.ts` as exact assertions with 600,000 iterations. Run the test.

Expected: PASS with the captured values.

- [ ] **Step 6: Commit**

```bash
git add src/core/generate.ts tests/core/generate.test.ts tests/core/golden.test.ts scripts/print-golden.ts package.json package-lock.json
git commit -m "feat(core): add generation orchestrator and golden vectors"
```

---

### Task 7: CSPRNG random fallback

**Files:**
- Create: `src/core/random.ts`
- Create: `tests/core/random.test.ts`

**Interfaces:**
- Produces: `generateRandomPassword(options: RandomOptions): { ok: true; password: string } | { ok: false; reason: "no-classes" }`
- `RandomOptions = { length: number; lowercase: boolean; uppercase: boolean; digits: boolean; symbols: boolean }`

- [ ] **Step 1: Write failing random tests**

```ts
it("generates the requested length with all classes", () => {
  const result = generateRandomPassword({ length: 24, lowercase: true, uppercase: true, digits: true, symbols: true });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.password).toHaveLength(24);
    expect(result.password).toMatch(/[a-z]/);
    expect(result.password).toMatch(/[A-Z]/);
    expect(result.password).toMatch(/[0-9]/);
    expect(result.password).toMatch(/[!@#$%^&*()\-_=+?.]/);
  }
});
it("rejects all classes disabled", () => {
  expect(generateRandomPassword({ length: 24, lowercase: false, uppercase: false, digits: false, symbols: false }))
    .toEqual({ ok: false, reason: "no-classes" });
});
it("is random across calls", () => {
  const make = () => generateRandomPassword({ length: 24, lowercase: true, uppercase: true, digits: true, symbols: true });
  expect(make()).not.toEqual(make());
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/core/random.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement with rejection sampling and a CSPRNG shuffle**

Build the selected alphabet, pick one character from each enabled class using rejection sampling, fill the rest, then Fisher–Yates shuffle with `randomBytes`. Never use modulo without rejection and never use `Math.random`.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/core/random.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/random.ts tests/core/random.test.ts
git commit -m "feat(core): add CSPRNG random password mode"
```

---

### Task 8: Entropy strength wrapper

**Files:**
- Create: `src/core/entropy.ts`
- Create: `tests/core/entropy.test.ts`

**Interfaces:**
- Produces: `estimateStrength(phrase: string): Promise<{ score: 0|1|2|3|4; label: string; warning: boolean }>`
- Lazy-loads zxcvbn-ts on first call.

- [ ] **Step 1: Write failing entropy tests**

```ts
it("scores a common password as very weak", async () => {
  const result = await estimateStrength("password");
  expect(result.score).toBeLessThanOrEqual(1);
  expect(result.warning).toBe(true);
});
it("maps scores to honest labels", () => {
  expect(labelForScore(0)).toMatch(/very weak/i);
  expect(labelForScore(1)).toMatch(/very weak/i);
  expect(labelForScore(2)).toMatch(/weak/i);
  expect(labelForScore(3)).toMatch(/low-risk/i);
  expect(labelForScore(4)).toMatch(/good phrase/i);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/core/entropy.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the lazy zxcvbn wrapper**

Use `await import("@zxcvbn-ts/core")`, `await import("@zxcvbn-ts/language-common")`, and `await import("@zxcvbn-ts/language-en")` once, cache the promise, call `zxcvbnOptions.setOptions`, and score the normalized phrase. `warning` is true for scores 0–2. The label function is exported for unit testing.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/core/entropy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/entropy.ts tests/core/entropy.test.ts
git commit -m "feat(core): add honest phrase strength estimation"
```

---

### Task 9: UI shell, live output, copy, and empty state

**Files:**
- Create: `src/components/PasswordOutput.tsx`, `src/components/ClassChips.tsx`
- Modify: `src/App.tsx`
- Create: `tests/ui/app.test.tsx`

**Interfaces:**
- Consumes: `generatePassword`, `GenerateOptions`, `ClassSet`.
- Produces: accessible input labeled “Phrase you’ll remember”, output region labeled “Generated password”, copy button, hide/show toggle.

- [ ] **Step 1: Write failing UI tests**

```tsx
// @vitest-environment jsdom
vi.mock("../../src/core/generate", () => ({
  generatePassword: vi.fn(async () => ({ ok: true, password: "p@$$w0rd-9K#mT7x", classes: {...}, length: 16, notices: [] })),
}));

it("shows output after typing and clears it when the phrase is cleared", async () => {
  render(<App />);
  const input = screen.getByLabelText(/phrase you'll remember/i);
  await userEvent.type(input, "password");
  expect(await screen.findByText("p@$$w0rd-9K#mT7x", {}, { timeout: 1500 })).toBeInTheDocument();
  await userEvent.clear(input);
  expect(screen.queryByText("p@$$w0rd-9K#mT7x")).not.toBeInTheDocument();
});
it("copies the password on user action", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<App />);
  await userEvent.type(screen.getByLabelText(/phrase/i), "password");
  await userEvent.click(await screen.findByRole("button", { name: /copy/i }));
  expect(writeText).toHaveBeenCalledWith("p@$$w0rd-9K#mT7x");
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/ui/app.test.tsx`
Expected: FAIL because the inputs and output do not exist.

- [ ] **Step 3: Implement the UI shell**

Use a 200 ms debounce in `useEffect`, a generation token, and `ignore` cleanup. While deriving, keep the previous output dimmed. Empty phrase clears output immediately. Render class chips with text labels. Use `aria-live="polite"` only for the copy confirmation, not every keystroke. No `console` calls.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/ui/app.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/PasswordOutput.tsx src/components/ClassChips.tsx tests/ui/app.test.tsx
git commit -m "feat(ui): add live phrase-to-password flow"
```

---

### Task 10: Advanced controls, site tag, secret, and warnings

**Files:**
- Create: `src/components/AdvancedPanel.tsx`
- Modify: `src/App.tsx`
- Create: `tests/ui/advanced.test.tsx`

**Interfaces:**
- Produces: site input labeled “Site or app (recommended)”, disclosure “Advanced options”, min-length slider, separator select, mode radio, secret input, read-only `v1` label.
- Produces: empty-site warning text.

- [ ] **Step 1: Write failing advanced tests**

```tsx
it("passes site, secret, length, separator, and mode to generation", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText(/phrase/i), "password");
  await userEvent.type(screen.getByLabelText(/site or app/i), "forum");
  await userEvent.click(screen.getByRole("button", { name: /advanced/i }));
  await userEvent.type(screen.getByLabelText(/extra secret/i), "Blue Fox");
  expect(vi.mocked(generatePassword)).toHaveBeenLastCalledWith(expect.objectContaining({
    site: "forum", secret: "Blue Fox", minLength: 16, separator: "-", mode: "reproducible",
  }));
});
it("warns when the site tag is empty", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText(/phrase/i), "password");
  expect(await screen.findByText(/add a site name/i)).toBeInTheDocument();
});
it("labels session-random as not reproducible", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /advanced/i }));
  await userEvent.click(screen.getByLabelText(/session-random/i));
  expect(screen.getByText(/not reproducible/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/ui/advanced.test.tsx`
Expected: FAIL because controls do not exist.

- [ ] **Step 3: Implement the advanced panel**

Use a native `<details>`/`<summary>` or a button with `aria-expanded` for the disclosure. Clamp min length 12–32. Separator options `-`, `_`, `.`, none. Mode radios. Secret field type password with show/hide. Display helper text about case and spaces. Keep the warning visible when site is empty.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/ui/advanced.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdvancedPanel.tsx src/App.tsx tests/ui/advanced.test.tsx
git commit -m "feat(ui): add advanced options and security warnings"
```

---

### Task 11: Strength meter and random fallback UI

**Files:**
- Create: `src/components/StrengthMeter.tsx`, `src/components/RandomMode.tsx`
- Modify: `src/App.tsx`
- Create: `tests/ui/strength.test.tsx`, `tests/ui/random-mode.test.tsx`

**Interfaces:**
- Consumes: `estimateStrength`, `generateRandomPassword`.
- Produces: mode tabs “Phrase” and “Random”, strength label/warning, class toggles, random length slider, random output/copy.

- [ ] **Step 1: Write failing strength and random tests**

```tsx
vi.mock("../../src/core/entropy", () => ({
  estimateStrength: vi.fn(async () => ({ score: 1, label: "Very weak — memorable only", warning: true })),
}));

it("shows the honest mnemonic warning and never says strong", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText(/phrase/i), "password");
  expect(await screen.findByText(/very weak/i)).toBeInTheDocument();
  expect(screen.queryByText(/^strong$/i)).not.toBeInTheDocument();
});
it("generates a random password in random mode", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("tab", { name: /random/i }));
  expect(await screen.findByText(/^[A-Za-z0-9!@#$%^&*()\-_=+?.]{20}$/)).toBeInTheDocument();
});
it("prevents disabling the last random character class", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("tab", { name: /random/i }));
  await userEvent.click(screen.getByLabelText(/lowercase/i));
  await userEvent.click(screen.getByLabelText(/uppercase/i));
  await userEvent.click(screen.getByLabelText(/digits/i));
  expect(screen.getByLabelText(/symbols/i)).toBeDisabled();
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/ui/strength.test.tsx tests/ui/random-mode.test.tsx`
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the strength meter and random mode**

Load strength asynchronously and show “Estimating…” until ready. The mnemonic warning is always visible. The random mode is a separate panel/tab with its own state; all classes start enabled; the last enabled class cannot be turned off; regenerate on option changes; copy works. Random mode may display “Strong” only from its own length/class calculation, never from the mnemonic meter.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- tests/ui/strength.test.tsx tests/ui/random-mode.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/StrengthMeter.tsx src/components/RandomMode.tsx src/App.tsx tests/ui/strength.test.tsx tests/ui/random-mode.test.tsx
git commit -m "feat(ui): add strength messaging and random fallback"
```

---

### Task 12: Security hardening and no-network/no-storage tests

**Files:**
- Modify: `index.html` (CSP meta and referrer policy)
- Create: `tests/security/static-guards.test.ts`
- Modify: `src/App.tsx` / components for any violations found

**Interfaces:**
- Produces: a source scan that fails if `src/` contains `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket(`, `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, `Math.random(`, `console.`, or `dangerouslySetInnerHTML`.
- Produces: a CSP meta tag matching the spec.

- [ ] **Step 1: Write the failing static guard test**

```ts
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const forbidden = [
  /\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bsendBeacon\b/, /\bWebSocket\s*\(/,
  /\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /document\.cookie/,
  /\bMath\.random\s*\(/, /\bconsole\./, /dangerouslySetInnerHTML/,
];

function files(dir: string): string[] { /* recursive walk */ }

it("contains no forbidden privacy or randomness APIs", () => {
  for (const file of files("src")) {
    const text = readFileSync(file, "utf8");
    for (const pattern of forbidden) expect(text, `${file} matches ${pattern}`).not.toMatch(pattern);
  }
});
it("sets the production CSP", () => {
  const html = readFileSync("index.html", "utf8");
  expect(html).toContain("connect-src 'none'");
  expect(html).toContain("default-src 'self'");
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/security/static-guards.test.ts`
Expected: FAIL if CSP is missing or any forbidden API is present.

- [ ] **Step 3: Fix violations and add CSP**

Allow `console` only in test files, not `src/`. Remove any forbidden API. Add the CSP meta tag and `<meta name="referrer" content="no-referrer">`.

- [ ] **Step 4: Run the full suite and build**

Run: `npm run test:run`
Expected: PASS.
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html src tests/security/static-guards.test.ts
git commit -m "chore(security): enforce local-only privacy guards and CSP"
```

---

### Task 13: Optional FastAPI host and Dockerfile

**Files:**
- Create: `server/main.py`, `server/requirements.txt`, `server/test_main.py`
- Create: `Dockerfile`, `.dockerignore`
- Create: `tests/server/health.test.ts` or a shell verification step

**Interfaces:**
- Produces: `GET /healthz` → `{"status":"ok"}`.
- Produces: static serving for `dist/` with CSP and security headers.
- Produces: no endpoint that accepts phrase/password data.

- [ ] **Step 1: Write a failing health test**

```python
from fastapi.testclient import TestClient
from main import app

def test_healthz():
    client = TestClient(app)
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 2: Run and verify failure**

Run: `cd server && python3 -m pytest -q`
Expected: FAIL because `main.py` does not exist (or import fails).

- [ ] **Step 3: Implement the FastAPI host**

Mount `dist/` with `StaticFiles(html=True)` at `/`, define `/healthz` before the mount, and add middleware for `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `X-Frame-Options: DENY`. Do not add request models or endpoints that accept user secrets.

- [ ] **Step 4: Run the health test and a live check**

Run: `cd server && python3 -m pytest -q`
Expected: PASS.
Run: `uvicorn main:app --port 8765` in the background, then `curl -s http://127.0.0.1:8765/healthz`.
Expected: `{"status":"ok"}`.

- [ ] **Step 5: Add the Dockerfile and commit**

Multi-stage build: Node build stage runs `npm ci && npm run build`; Python stage copies `dist/` and `server/`, installs requirements, runs as a non-root user, exposes 8000, and starts uvicorn.

```bash
git add server Dockerfile .dockerignore
git commit -m "feat(server): add static FastAPI host and health check"
```

---

### Task 14: E2E, accessibility, README, and final verification

**Files:**
- Create: `playwright.config.ts`, `e2e/app.spec.ts`
- Modify: `README.md`
- Modify: any UI issues found

**Interfaces:**
- Produces: Chromium E2E coverage for typing, debounce, copy, advanced options, random mode, mobile width, and keyboard flow.

- [ ] **Step 1: Write the failing E2E test**

```ts
test("phrase to password flow", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/phrase you'll remember/i).fill("my dog loves bacon");
  await expect(page.getByTestId("password-output")).toContainText(/[A-Za-z0-9]/);
  await expect(page.getByText(/memorable is not the same as strong/i)).toBeVisible();
});
test("mobile layout has no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npx playwright install chromium && npm run test:e2e`
Expected: FAIL until the dev server/config and selectors are in place.

- [ ] **Step 3: Implement Playwright config and fix the UI**

`webServer` runs `npm run dev -- --port 4173` with `reuseExistingServer`. Add stable test IDs only where text selectors are brittle. Ensure output is `data-testid="password-output"`. Fix any layout/contrast issues found.

- [ ] **Step 4: Run the full verification**

Run each and capture output:

```bash
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
```

Expected: all exit 0.

- [ ] **Step 5: Update README and commit**

README covers: what Passy is, the security trade-off, how to run, how to test, the optional backend, and the fact that no phrase leaves the browser. Include the algorithm version and where the spec lives.

```bash
git add README.md playwright.config.ts e2e
git commit -m "test: add E2E coverage and document v1.0.0"
```

---

## Self-Review

- **Spec coverage:** normalization, derivation, substitution, padding, class repair, validation, session-random, random fallback, entropy honesty, UI, advanced options, privacy, CSP, backend host, tests, and deployment each map to a task.
- **Type consistency:** `GenerateOptions`, `GenerateResult`, `Notice`, `ClassSet`, `ByteStream`, `transformFromBytes`, `generatePassword`, and `generateRandomPassword` are defined once and reused.
- **Review Focus:** Unicode handling is covered in Task 2; tiny/punctuation-only input in Task 5; overlong input in Task 5; secret normalization in Task 2 and orchestration in Task 6; stale async in Task 9.
- **Open risk:** zxcvbn-ts lazy loading and the exact package API must be verified during Task 8; if the API differs, adapt the wrapper without changing the public `estimateStrength` contract.
