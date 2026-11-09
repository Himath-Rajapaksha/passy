export type Mode = "reproducible" | "session-random";

export type Separator = "-" | "_" | "." | "";

export type NoticeCode =
  | "phrase-truncated"
  | "characters-removed"
  | "output-truncated"
  | "padding-added";

export type Notice = {
  code: NoticeCode;
  message: string;
  count?: number;
};

export type ClassSet = {
  lowercase: boolean;
  uppercase: boolean;
  digit: boolean;
  symbol: boolean;
};

export type GenerateOptions = {
  phrase: string;
  site: string;
  secret: string;
  minLength: number;
  separator: Separator;
  mode: Mode;
};

export type GenerateFailureReason =
  | "empty"
  | "no-usable-characters"
  | "unsupported-browser"
  | "internal";

export type GenerateResult =
  | {
      ok: true;
      password: string;
      classes: ClassSet;
      length: number;
      notices: Notice[];
    }
  | { ok: false; reason: GenerateFailureReason };
