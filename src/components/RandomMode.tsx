import { useEffect, useId, useState } from "react";
import { SAFE_SYMBOLS } from "../core/constants";
import { generateRandomPassword } from "../core/random";

const CLASS_OPTIONS = [
  { key: "lowercase", label: "Lowercase letters (a-z)", size: 26 },
  { key: "uppercase", label: "Uppercase letters (A-Z)", size: 26 },
  { key: "digits", label: "Digits (0-9)", size: 10 },
  { key: "symbols", label: "Symbols", size: SAFE_SYMBOLS.length },
] as const;

type ClassKey = (typeof CLASS_OPTIONS)[number]["key"];
type ClassState = Record<ClassKey, boolean>;

const ALL_CLASSES: ClassState = {
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
};

const MIN_RANDOM_LENGTH = 16;
const MAX_RANDOM_LENGTH = 64;
const DEFAULT_RANDOM_LENGTH = 20;

function strengthLabel(bits: number): string {
  if (bits >= 100) return "Strong";
  if (bits >= 80) return "Good";
  if (bits >= 60) return "Okay";
  return "Weak";
}

export default function RandomMode() {
  const lengthId = useId();
  const [length, setLength] = useState(DEFAULT_RANDOM_LENGTH);
  const [classes, setClasses] = useState<ClassState>(ALL_CLASSES);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const result = generateRandomPassword({ length, ...classes });
    setPassword(result.ok ? result.password : "");
    setCopied(false);
  }, [length, classes]);

  const enabledCount = CLASS_OPTIONS.filter(({ key }) => classes[key]).length;
  const alphabetSize = CLASS_OPTIONS.reduce(
    (total, { key, size }) => total + (classes[key] ? size : 0),
    0,
  );
  const bits = Math.floor(length * Math.log2(alphabetSize));

  function toggleClass(key: ClassKey) {
    setClasses((current) => {
      if (current[key] && enabledCount === 1) return current;
      return { ...current, [key]: !current[key] };
    });
  }

  async function handleCopy() {
    if (password === "") return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      aria-labelledby="random-heading"
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2
        id="random-heading"
        className="text-base font-semibold text-stone-900"
      >
        Random password
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Generated with your browser's secure random generator. Nothing is stored
        and nothing can be re-derived later.
      </p>

      <div className="mt-4 rounded-xl bg-stone-900 px-4 py-5">
        <p
          data-testid="random-output"
          className="break-all font-mono text-xl leading-relaxed text-emerald-100 sm:text-2xl"
        >
          {password}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={password === ""}
          className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Copy password
        </button>
        <p className="text-sm text-stone-600">
          ≈ {bits} bits · {strengthLabel(bits)}
        </p>
      </div>

      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-emerald-800">
        {copied ? "Password copied." : ""}
      </p>

      <div className="mt-5 border-t border-stone-200 pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={lengthId} className="font-medium text-stone-900">
            Random length
          </label>
          <output
            htmlFor={lengthId}
            className="rounded bg-stone-100 px-2 py-0.5 font-mono text-sm text-stone-800"
          >
            {length}
          </output>
        </div>
        <input
          id={lengthId}
          type="range"
          min={MIN_RANDOM_LENGTH}
          max={MAX_RANDOM_LENGTH}
          step={1}
          value={length}
          onChange={(event) => {
            const next = Number(event.target.value);
            setLength(
              Math.min(
                MAX_RANDOM_LENGTH,
                Math.max(MIN_RANDOM_LENGTH, Number.isFinite(next) ? next : 20),
              ),
            );
          }}
          className="mt-3 w-full accent-emerald-700"
        />
        <p className="mt-1 text-sm text-stone-600">
          We recommend at least 20 characters for valuable accounts.
        </p>
      </div>

      <fieldset className="mt-5">
        <legend className="font-medium text-stone-900">Character classes</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CLASS_OPTIONS.map(({ key, label }) => {
            const lastEnabled = classes[key] && enabledCount === 1;
            return (
              <label
                key={key}
                className="flex min-h-11 items-center gap-3 rounded-lg border border-stone-200 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={classes[key]}
                  disabled={lastEnabled}
                  onChange={() => toggleClass(key)}
                  className="h-4 w-4 accent-emerald-700"
                />
                <span className="text-stone-800">{label}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-stone-600">
          At least one class must stay enabled.
        </p>
      </fieldset>

      <p className="mt-5 border-t border-stone-200 pt-4 text-sm leading-relaxed text-stone-600">
        This is the safe choice for email, banking, and work accounts. Save it in
        your password manager before you leave this page.
      </p>
    </section>
  );
}
