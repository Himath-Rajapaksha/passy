import { expect, it } from "vitest";
import { generateRandomPassword } from "../../src/core/random";

const all = {
  length: 24,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
};

it("generates the requested length with all classes", () => {
  const result = generateRandomPassword(all);
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
  expect(
    generateRandomPassword({
      length: 24,
      lowercase: false,
      uppercase: false,
      digits: false,
      symbols: false,
    }),
  ).toEqual({ ok: false, reason: "no-classes" });
});
it("is random across calls", () => {
  const make = () => generateRandomPassword(all);
  expect(make()).not.toEqual(make());
});
it("uses only the enabled classes", () => {
  const result = generateRandomPassword({
    ...all,
    lowercase: false,
    uppercase: false,
    symbols: false,
  });
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.password).toMatch(/^[0-9]{24}$/);
});
it("includes every enabled class", () => {
  for (let run = 0; run < 20; run += 1) {
    const result = generateRandomPassword(all);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.password).toMatch(/[a-z]/);
      expect(result.password).toMatch(/[A-Z]/);
      expect(result.password).toMatch(/[0-9]/);
      expect(result.password).toMatch(/[!@#$%^&*()\-_=+?.]/);
    }
  }
});
