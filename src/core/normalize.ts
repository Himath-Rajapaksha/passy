import {
  MAX_PHRASE_CODE_POINTS,
  MAX_SECRET_CODE_POINTS,
  MAX_SITE_CODE_POINTS,
} from "./constants";

const SPECIAL_LATIN: Record<string, string> = {
  ß: "ss",
  ẞ: "SS",
  ø: "o",
  Ø: "O",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  ð: "d",
  Ð: "D",
  þ: "th",
  Þ: "Th",
  ı: "i",
  ŋ: "ng",
  Ŋ: "Ng",
};

const CONTROL_OR_FORMAT = /[\p{Cc}\p{Cf}]/gu;

function capCodePoints(value: string, cap: number): string {
  return Array.from(value).slice(0, cap).join("");
}

/**
 * Unicode cleanup shared by phrase and site tag input. NFKC, strip
 * combining marks left by NFD, apply the explicit Latin map, then keep
 * printable ASCII only. Dropped characters are counted.
 */
function cleanToAscii(raw: string, cap: number): {
  value: string;
  removed: number;
  truncated: boolean;
} {
  const truncated = Array.from(raw).length > cap;
  let value = capCodePoints(raw, cap);
  value = value.normalize("NFKC");
  value = value.normalize("NFD").replace(/\p{M}/gu, "");
  value = Array.from(value)
    .map((character) => SPECIAL_LATIN[character] ?? character)
    .join("");
  value = value.replace(/\s+/gu, " ").trim();

  let removed = 0;
  let kept = "";
  for (const character of value) {
    if (character === " ") {
      kept += character;
      continue;
    }
    const code = character.codePointAt(0)!;
    if (code >= 0x20 && code <= 0x7e) {
      kept += character;
    } else {
      removed += 1;
    }
  }

  kept = kept.replace(/\s+/gu, " ").trim();
  kept = capCodePoints(kept, cap);
  return { value: kept, removed, truncated };
}

export function normalizePhrase(raw: string): {
  value: string;
  removed: number;
  truncated: boolean;
} {
  return cleanToAscii(raw, MAX_PHRASE_CODE_POINTS);
}

export function normalizeSite(raw: string): string {
  const cleaned = cleanToAscii(raw, MAX_SITE_CODE_POINTS).value;
  const slug = cleaned
    .toLowerCase()
    .replace(/\s+/gu, "-")
    .replace(/[^a-z0-9._-]/gu, "");
  return capCodePoints(slug, MAX_SITE_CODE_POINTS);
}

export function normalizeSecret(raw: string): string {
  const value = raw
    .normalize("NFKC")
    .replace(CONTROL_OR_FORMAT, "")
    .trim();
  return capCodePoints(value, MAX_SECRET_CODE_POINTS);
}
