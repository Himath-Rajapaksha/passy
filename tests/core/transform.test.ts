import { expect, it } from "vitest";
import fc from "fast-check";
import {
  transformFromBytes,
  isValidOutput,
  hasAllClasses,
} from "../../src/core/transform";
import type { GenerateOptions } from "../../src/core/types";

const base: GenerateOptions = {
  phrase: "x",
  site: "",
  secret: "",
  minLength: 16,
  separator: "-",
  mode: "reproducible",
};

it("truncates to 64 without a trailing separator", () => {
  const out = transformFromBytes(
    "a".repeat(100),
    base,
    new Uint8Array(4096).fill(1),
  );
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

it("reports truncation when the transformed phrase exceeds 64", () => {
  const out = transformFromBytes(
    "a".repeat(100),
    base,
    new Uint8Array(4096).fill(1),
  );
  expect(out.notices.some((notice) => notice.code === "output-truncated")).toBe(
    true,
  );
});

it("returns empty for an empty phrase", () => {
  expect(
    transformFromBytes("", base, new Uint8Array(4096).fill(1)).password,
  ).toBe("");
});

it("enforces the minimum even when it is clamped", () => {
  const out = transformFromBytes(
    "x",
    { ...base, minLength: 4 },
    new Uint8Array(4096).fill(3),
  );
  expect(out.password.length).toBeGreaterThanOrEqual(12);
  expect(isValidOutput(out.password, 12)).toBe(true);
});

it("always produces a valid output for printable input", () => {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !?@#".split(
    "",
  );
  fc.assert(
    fc.property(
      fc
        .array(fc.constantFrom(...alphabet), { minLength: 1, maxLength: 40 })
        .map((characters) => characters.join("")),
      fc.uint8Array({ minLength: 4096, maxLength: 4096 }),
      (phrase, bytes) => {
        const out = transformFromBytes(phrase, base, bytes);
        return (
          isValidOutput(out.password, 16) && hasAllClasses(out.password)
        );
      },
    ),
    { numRuns: 100 },
  );
});
