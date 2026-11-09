import { expect, it } from "vitest";
import {
  deriveSeed,
  expandKeystream,
  randomBytes,
  zeroBytes,
} from "../../src/core/derive";
import { ByteStream } from "../../src/core/byteStream";

it("derives the same seed for the same material", async () => {
  const a = await deriveSeed(
    "password\0forum\0",
    new TextEncoder().encode("salt"),
    1000,
  );
  const b = await deriveSeed(
    "password\0forum\0",
    new TextEncoder().encode("salt"),
    1000,
  );
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
  // For bound 3 the limit is 255, so the leading 255 is rejected.
  const stream = new ByteStream(new Uint8Array([255, 0, 1, 2, 3]));
  expect(stream.nextIndex(3)).toBe(0);
  expect(stream.nextIndex(3)).toBe(1);
});
it("zeroes a buffer", () => {
  const bytes = new Uint8Array([1, 2, 3]);
  zeroBytes(bytes);
  expect(Array.from(bytes)).toEqual([0, 0, 0]);
});
it("creates random bytes of the requested length", () => {
  const a = randomBytes(24);
  const b = randomBytes(24);
  expect(a).toHaveLength(24);
  expect(Array.from(a)).not.toEqual(Array.from(b));
});
