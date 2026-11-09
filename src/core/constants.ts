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
