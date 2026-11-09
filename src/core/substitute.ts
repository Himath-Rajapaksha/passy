import { ByteStream } from "./byteStream";
import { CANDIDATE_MAP, SAFE_SYMBOLS } from "./constants";
import type { Separator } from "./types";

const ASCII_LETTER_OR_DIGIT = /^[A-Za-z0-9]$/;

export function substitute(
  phrase: string,
  separator: Separator,
  bytes: Uint8Array,
): string {
  const stream = new ByteStream(bytes);
  let output = "";

  for (const character of phrase) {
    if (character === " ") {
      if (separator !== "") output += separator;
      continue;
    }

    const lower = character.toLowerCase();
    const candidates = CANDIDATE_MAP[lower];
    if (candidates) {
      const candidate = candidates[stream.nextIndex(candidates.length)];
      output +=
        character !== lower ? candidate.toUpperCase() : candidate;
      continue;
    }

    if (ASCII_LETTER_OR_DIGIT.test(character)) {
      output += character;
      continue;
    }

    if (SAFE_SYMBOLS.includes(character)) {
      output += character;
      continue;
    }

    output += SAFE_SYMBOLS[stream.nextIndex(SAFE_SYMBOLS.length)];
  }

  return output;
}
