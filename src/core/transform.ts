import { ByteStream } from "./byteStream";
import {
  MAX_MIN_LENGTH,
  MAX_OUTPUT_LENGTH,
  MIN_LENGTH,
  SAFE_SYMBOLS,
} from "./constants";
import { substituteWithStream } from "./substitute";
import type { ClassSet, GenerateOptions, Notice } from "./types";

const OUTPUT_PATTERN = /^[A-Za-z0-9!@#$%^&*()\-_=+?.]+$/;
const PADDING_ALPHABET = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789${SAFE_SYMBOLS}`;
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";

const LEET_DIGITS: Record<string, string> = {
  o: "0",
  i: "1",
  e: "3",
  a: "4",
  s: "5",
  t: "7",
};

const LEET_SYMBOLS: Record<string, string> = {
  a: "@",
  s: "$",
  i: "!",
  c: "(",
};

const CLASS_KEYS: (keyof ClassSet)[] = [
  "lowercase",
  "uppercase",
  "digit",
  "symbol",
];

type Candidate = { index: number; char: string };

export function computeClasses(value: string): ClassSet {
  let classes: ClassSet = {
    lowercase: false,
    uppercase: false,
    digit: false,
    symbol: false,
  };
  for (const character of value) {
    if (/[a-z]/.test(character)) classes.lowercase = true;
    else if (/[A-Z]/.test(character)) classes.uppercase = true;
    else if (/[0-9]/.test(character)) classes.digit = true;
    else if (SAFE_SYMBOLS.includes(character)) classes.symbol = true;
  }
  return classes;
}

export function hasAllClasses(value: string): boolean {
  const classes = computeClasses(value);
  return CLASS_KEYS.every((key) => classes[key]);
}

export function isValidOutput(value: string, minLength: number): boolean {
  if (value.length < minLength || value.length > MAX_OUTPUT_LENGTH) return false;
  if (!OUTPUT_PATTERN.test(value)) return false;
  return hasAllClasses(value);
}

function clampMinimum(minLength: number): number {
  if (!Number.isFinite(minLength)) return MIN_LENGTH;
  return Math.min(MAX_MIN_LENGTH, Math.max(MIN_LENGTH, Math.trunc(minLength)));
}

function replaceAt(value: string, index: number, character: string): string {
  return value.slice(0, index) + character + value.slice(index + 1);
}

function keepsExistingClasses(
  value: string,
  classes: ClassSet,
  target: keyof ClassSet,
  candidate: Candidate,
): boolean {
  const next = replaceAt(value, candidate.index, candidate.char);
  const nextClasses = computeClasses(next);
  if (!nextClasses[target]) return false;
  return CLASS_KEYS.every(
    (key) => key === target || !classes[key] || nextClasses[key],
  );
}

function buildCandidates(
  value: string,
  target: keyof ClassSet,
  classes: ClassSet,
  stream: ByteStream,
): Candidate[] {
  const preferred: Candidate[] = [];
  const generic: Candidate[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const lower = character.toLowerCase();

    if (target === "uppercase") {
      if (/[a-z]/.test(character)) {
        preferred.push({ index, char: character.toUpperCase() });
      } else {
        generic.push({
          index,
          char: UPPERCASE[stream.nextIndex(UPPERCASE.length)],
        });
      }
    } else if (target === "lowercase") {
      if (/[A-Z]/.test(character)) {
        preferred.push({ index, char: character.toLowerCase() });
      } else {
        generic.push({
          index,
          char: LOWERCASE[stream.nextIndex(LOWERCASE.length)],
        });
      }
    } else if (target === "digit") {
      const leet = LEET_DIGITS[lower];
      if (leet) {
        preferred.push({ index, char: leet });
      } else {
        generic.push({ index, char: DIGITS[stream.nextIndex(DIGITS.length)] });
      }
    } else {
      const leet = LEET_SYMBOLS[lower];
      if (leet) {
        preferred.push({ index, char: leet });
      } else {
        generic.push({
          index,
          char: SAFE_SYMBOLS[stream.nextIndex(SAFE_SYMBOLS.length)],
        });
      }
    }
  }

  const valid = (candidate: Candidate) =>
    keepsExistingClasses(value, classes, target, candidate);

  const preferredValid = preferred.filter(valid);
  if (preferredValid.length > 0) return preferredValid;
  return generic.filter(valid);
}

function enforceClasses(
  value: string,
  stream: ByteStream,
): string {
  let output = value;
  for (const target of CLASS_KEYS) {
    const classes = computeClasses(output);
    if (classes[target]) continue;
    const candidates = buildCandidates(output, target, classes, stream);
    if (candidates.length === 0) {
      throw new Error("internal");
    }
    const chosen = candidates[stream.nextIndex(candidates.length)];
    output = replaceAt(output, chosen.index, chosen.char);
  }
  return output;
}

export function transformFromBytes(
  normalizedPhrase: string,
  options: GenerateOptions,
  bytes: Uint8Array,
): { password: string; notices: Notice[] } {
  const notices: Notice[] = [];
  if (normalizedPhrase === "") {
    return { password: "", notices };
  }

  const stream = new ByteStream(bytes);
  const separator = options.separator;
  const minimum = clampMinimum(options.minLength);

  let output = substituteWithStream(normalizedPhrase, separator, stream);

  if (output.length > MAX_OUTPUT_LENGTH) {
    output = output.slice(0, MAX_OUTPUT_LENGTH);
    if (separator !== "" && output.endsWith(separator)) {
      output = output.slice(0, -1);
    }
    notices.push({
      code: "output-truncated",
      message: "Output shortened to 64 characters.",
    });
  }

  if (
    output.length > 0 &&
    output.length < minimum &&
    separator !== "" &&
    !output.endsWith(separator) &&
    output.length + 1 < minimum
  ) {
    output += separator;
  }

  const paddingAlphabet =
    separator === "" ? PADDING_ALPHABET : PADDING_ALPHABET.replace(separator, "");
  while (output.length < minimum) {
    output += paddingAlphabet[stream.nextIndex(paddingAlphabet.length)];
  }

  if (separator !== "" && output.endsWith(separator)) {
    output =
      output.slice(0, -1) + LOWERCASE[stream.nextIndex(LOWERCASE.length)];
  }

  output = enforceClasses(output, stream);

  if (!isValidOutput(output, minimum)) {
    throw new Error("internal");
  }

  return { password: output, notices };
}
