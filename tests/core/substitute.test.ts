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

describe("candidate weighting", () => {
  it("can select each candidate from the map", () => {
    expect(substitute("a", "-", new Uint8Array([0]))).toBe("a");
    expect(substitute("a", "-", new Uint8Array([1]))).toBe("a");
    expect(substitute("a", "-", new Uint8Array([2]))).toBe("@");
    expect(substitute("a", "-", new Uint8Array([3]))).toBe("4");
  });
  it("uppercases selected letters but not digits or symbols", () => {
    expect(substitute("E", "-", new Uint8Array([0]))).toBe("E");
    expect(substitute("E", "-", new Uint8Array([2]))).toBe("3");
    expect(substitute("S", "-", new Uint8Array([2]))).toBe("$");
  });
});
