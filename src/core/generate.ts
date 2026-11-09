import { ALGORITHM_VERSION, MAX_PHRASE_CODE_POINTS } from "./constants";
import { deriveSeed, expandKeystream, randomBytes, zeroBytes } from "./derive";
import { normalizePhrase, normalizeSecret, normalizeSite } from "./normalize";
import { computeClasses, transformFromBytes } from "./transform";
import type { GenerateOptions, GenerateResult, Notice } from "./types";

const REPRODUCIBLE_SALT = new TextEncoder().encode("passy-mnemonic-v1");
const KEYSTREAM_LENGTH = 4096;

export function buildMaterial(
  normalizedPhrase: string,
  normalizedSite: string,
  normalizedSecret: string,
): string {
  return `passy:${ALGORITHM_VERSION}\0${normalizedPhrase}\0${normalizedSite}\0${normalizedSecret}`;
}

export async function computeOutput(
  options: GenerateOptions,
  iterations?: number,
): Promise<GenerateResult> {
  if (options.phrase.trim() === "") {
    return { ok: false, reason: "empty" };
  }

  const phrase = normalizePhrase(options.phrase);
  if (phrase.value === "") {
    return { ok: false, reason: "no-usable-characters" };
  }

  const site = normalizeSite(options.site);
  const secret = normalizeSecret(options.secret);
  const material = buildMaterial(phrase.value, site, secret);
  const salt =
    options.mode === "session-random" ? randomBytes(16) : REPRODUCIBLE_SALT;

  let seed: Uint8Array | undefined;
  let keystream: Uint8Array | undefined;

  try {
    seed = await deriveSeed(material, salt, iterations);
    keystream = await expandKeystream(seed, KEYSTREAM_LENGTH);
    const transformed = transformFromBytes(
      phrase.value,
      options,
      keystream,
    );

    const notices: Notice[] = [];
    if (phrase.truncated) {
      notices.push({
        code: "phrase-truncated",
        message: `Phrase shortened to ${MAX_PHRASE_CODE_POINTS} characters.`,
      });
    }
    if (phrase.removed > 0) {
      notices.push({
        code: "characters-removed",
        message:
          phrase.removed === 1
            ? "1 unsupported character removed."
            : `${phrase.removed} unsupported characters removed.`,
        count: phrase.removed,
      });
    }
    notices.push(...transformed.notices);

    return {
      ok: true,
      password: transformed.password,
      classes: computeClasses(transformed.password),
      length: transformed.password.length,
      notices,
    };
  } catch {
    return { ok: false, reason: "internal" };
  } finally {
    if (seed) zeroBytes(seed);
    if (keystream) zeroBytes(keystream);
  }
}

export async function generatePassword(
  options: GenerateOptions,
): Promise<GenerateResult> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return { ok: false, reason: "unsupported-browser" };
  }
  return computeOutput(options);
}
