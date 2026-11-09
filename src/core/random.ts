import { SAFE_SYMBOLS } from "./constants";
import { randomBytes } from "./derive";

export type RandomOptions = {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
};

export type RandomResult =
  | { ok: true; password: string }
  | { ok: false; reason: "no-classes" };

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const MIN_RANDOM_LENGTH = 4;
const MAX_RANDOM_LENGTH = 64;

function randomIndex(bound: number): number {
  const limit = 256 - (256 % bound);
  for (;;) {
    const value = randomBytes(1)[0];
    if (value < limit) return value % bound;
  }
}

export function generateRandomPassword(options: RandomOptions): RandomResult {
  const classes: string[] = [];
  if (options.lowercase) classes.push(LOWERCASE);
  if (options.uppercase) classes.push(UPPERCASE);
  if (options.digits) classes.push(DIGITS);
  if (options.symbols) classes.push(SAFE_SYMBOLS);

  if (classes.length === 0) {
    return { ok: false, reason: "no-classes" };
  }

  const requested = Number.isFinite(options.length)
    ? Math.trunc(options.length)
    : MIN_RANDOM_LENGTH;
  const length = Math.min(
    MAX_RANDOM_LENGTH,
    Math.max(MIN_RANDOM_LENGTH, requested, classes.length),
  );
  const alphabet = classes.join("");

  const characters: string[] = [];
  for (const characterClass of classes) {
    characters.push(characterClass[randomIndex(characterClass.length)]);
  }
  while (characters.length < length) {
    characters.push(alphabet[randomIndex(alphabet.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapWith = randomIndex(index + 1);
    [characters[index], characters[swapWith]] = [
      characters[swapWith],
      characters[index],
    ];
  }

  return { ok: true, password: characters.join("") };
}
