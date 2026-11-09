import { expect, it } from "vitest";
import { estimateStrength, labelForScore } from "../../src/core/entropy";

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
it("labels a long random-looking phrase as a good phrase", async () => {
  const result = await estimateStrength(
    "violet tundra lantern quasar meadow compass",
  );
  expect(result.score).toBeGreaterThanOrEqual(3);
  expect(result.warning).toBe(false);
  expect(result.label).toMatch(/low-risk|good phrase/i);
});
