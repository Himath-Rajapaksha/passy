import type { Notice } from "../core/types";

type PasswordOutputProps = {
  password: string;
  length: number;
  minLength: number;
  deriving: boolean;
  hidden: boolean;
  copied: boolean;
  notices: Notice[];
  onToggleHidden: () => void;
  onCopy: () => void;
};

export default function PasswordOutput({
  password,
  length,
  minLength,
  deriving,
  hidden,
  copied,
  notices,
  onToggleHidden,
  onCopy,
}: PasswordOutputProps) {
  const hasPassword = password.length > 0;

  return (
    <section
      aria-labelledby="output-heading"
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="output-heading"
          className="text-sm font-semibold uppercase tracking-wide text-stone-500"
        >
          Generated password
        </h2>
        {hasPassword && (
          <p className="text-sm text-stone-500">
            {length} characters · minimum {minLength}
          </p>
        )}
      </div>

      <div
        className={`mt-3 rounded-xl bg-stone-900 px-4 py-5 transition-opacity ${
          deriving ? "opacity-50" : "opacity-100"
        }`}
      >
        {hasPassword ? (
          <p
            data-testid="password-output"
            className="break-all font-mono text-xl leading-relaxed text-emerald-100 sm:text-2xl"
          >
            {hidden ? "•".repeat(Math.min(length, 32)) : password}
          </p>
        ) : (
          <p className="font-mono text-lg text-stone-400">
            Start typing a phrase.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCopy}
          disabled={!hasPassword || deriving}
          className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Copy password
        </button>
        <button
          type="button"
          onClick={onToggleHidden}
          disabled={!hasPassword}
          className="min-h-11 rounded-lg border border-stone-300 px-4 py-2 font-medium text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:text-stone-400"
        >
          {hidden ? "Show" : "Hide"}
        </button>
        {deriving && (
          <span className="text-sm text-stone-500" role="status">
            Deriving…
          </span>
        )}
      </div>

      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-emerald-800">
        {copied ? "Password copied." : ""}
      </p>

      {notices.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-stone-600">
          {notices.map((notice) => (
            <li key={notice.code}>{notice.message}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
