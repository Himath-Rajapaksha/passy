import { describe, expect, it } from "vitest";
import {
  buildMaterial,
  computeOutput,
  generatePassword,
} from "../../src/core/generate";
import type { GenerateOptions } from "../../src/core/types";

const base: GenerateOptions = {
  phrase: "password",
  site: "",
  secret: "",
  minLength: 16,
  separator: "-",
  mode: "reproducible",
};

describe("buildMaterial", () => {
  it("separates the version, phrase, site, and secret with NUL bytes", () => {
    expect(buildMaterial("password", "forum", "Blue Fox")).toBe(
      "passy:v1\0password\0forum\0Blue Fox",
    );
  });
});

describe("generatePassword", () => {
  it("returns empty for an empty phrase", async () => {
    const result = await generatePassword({ ...base, phrase: "   " });
    expect(result).toEqual({ ok: false, reason: "empty" });
  });
  it("returns no-usable-characters for emoji only", async () => {
    const result = await generatePassword({ ...base, phrase: "😀😀" });
    expect(result).toEqual({ ok: false, reason: "no-usable-characters" });
  });
  it("returns a policy-compliant result with metadata", async () => {
    const result = await generatePassword({ ...base, phrase: "password" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.password).toHaveLength(16);
      expect(result.length).toBe(16);
      expect(result.classes).toEqual({
        lowercase: true,
        uppercase: true,
        digit: true,
        symbol: true,
      });
      expect(result.notices).toEqual([]);
    }
  });
});

describe("computeOutput", () => {
  it("is deterministic for the same inputs", async () => {
    const a = await computeOutput(
      { ...base, phrase: "password", site: "forum" },
      1000,
    );
    const b = await computeOutput(
      { ...base, phrase: "password", site: "forum" },
      1000,
    );
    expect(a).toEqual(b);
  });
  it("changes output when the site changes", async () => {
    const a = await computeOutput(
      { ...base, phrase: "password", site: "forum" },
      1000,
    );
    const b = await computeOutput(
      { ...base, phrase: "password", site: "shop" },
      1000,
    );
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.password).not.toBe(b.password);
  });
  it("changes output when the secret changes", async () => {
    const a = await computeOutput(
      { ...base, phrase: "password", secret: "a" },
      1000,
    );
    const b = await computeOutput(
      { ...base, phrase: "password", secret: "b" },
      1000,
    );
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.password).not.toBe(b.password);
  });
  it("produces different output in session-random mode", async () => {
    const a = await generatePassword({
      ...base,
      phrase: "password",
      mode: "session-random",
    });
    const b = await generatePassword({
      ...base,
      phrase: "password",
      mode: "session-random",
    });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.password).not.toBe(b.password);
  });
  it("reports removed characters", async () => {
    const result = await generatePassword({
      ...base,
      phrase: "hi 😀 there",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.notices).toContainEqual(
        expect.objectContaining({ code: "characters-removed", count: 1 }),
      );
    }
  });
  it("reports phrase truncation", async () => {
    const result = await generatePassword({
      ...base,
      phrase: "a".repeat(300),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.notices).toContainEqual(
        expect.objectContaining({ code: "phrase-truncated" }),
      );
    }
  });
});
