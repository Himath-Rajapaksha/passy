const HKDF_INFO = new TextEncoder().encode("passy-map-v1");
const MAX_HKDF_BYTES = 255 * 32;
const DEFAULT_ITERATIONS = 600_000;

export async function deriveSeed(
  material: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_ITERATIONS,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(material),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function expandKeystream(
  seed: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  if (!Number.isInteger(length) || length < 0 || length > MAX_HKDF_BYTES) {
    throw new RangeError(`Keystream length must be 0..${MAX_HKDF_BYTES}`);
  }
  if (length === 0) return new Uint8Array(0);
  const key = await crypto.subtle.importKey("raw", seed, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: HKDF_INFO,
    },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

export function randomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length < 0 || length > 65536) {
    throw new RangeError("Random byte length must be 0..65536");
  }
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function zeroBytes(bytes: Uint8Array): void {
  bytes.fill(0);
}
