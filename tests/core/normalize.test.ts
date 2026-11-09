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
  it("reports truncation caused by NFKC expansion", () => {
    const result = normalizePhrase("ﬁ".repeat(200));
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
