export const ALGORITHM_VERSION = "v1" as const;

export const MIN_LENGTH = 12;
export const DEFAULT_MIN_LENGTH = 16;
export const MAX_MIN_LENGTH = 32;
export const MAX_OUTPUT_LENGTH = 64;
export const MAX_PHRASE_CODE_POINTS = 256;
export const MAX_SITE_CODE_POINTS = 64;
export const MAX_SECRET_CODE_POINTS = 128;

export const SAFE_SYMBOLS = "!@#$%^&*()-_=+?.";
export const SEPARATORS = ["-", "_", ".", ""] as const;

/**
 * Weighted lowercase candidate lists. Repeating the original character
 * biases the output toward resemblance. Uppercase input re-cases letter
 * candidates at substitution time.
 */
export const CANDIDATE_MAP: Record<string, readonly string[]> = {
  a: ["a", "a", "@", "4"],
  b: ["b", "b", "8"],
  c: ["c", "c", "("],
  e: ["e", "e", "3"],
  g: ["g", "g", "9", "6"],
  i: ["i", "i", "!", "1"],
  l: ["l", "l", "1"],
  o: ["o", "o", "0"],
  s: ["s", "s", "$", "5"],
  t: ["t", "t", "7"],
  z: ["z", "z", "2"],
};
