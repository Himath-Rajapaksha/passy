import { useEffect, useId, useState } from "react";
import ClassChips from "./components/ClassChips";
import PasswordOutput from "./components/PasswordOutput";
import { DEFAULT_MIN_LENGTH } from "./core/constants";
import { generatePassword } from "./core/generate";
import type {
  GenerateOptions,
  GenerateResult,
  Separator,
} from "./core/types";

const DEBOUNCE_MS = 200;

function failureMessage(result: GenerateResult | null): string | null {
  if (!result || result.ok) return null;
  switch (result.reason) {
    case "no-usable-characters":
      return "No usable characters in that phrase.";
    case "unsupported-browser":
      return "This browser or connection can't run Passy securely. Use a current browser over HTTPS.";
    case "internal":
      return "Something went wrong. No password was generated.";
    default:
      return null;
  }
}

export default function App() {
  const phraseId = useId();
  const [phrase, setPhrase] = useState("");
  const [site] = useState("");
  const [secret] = useState("");
  const [minLength] = useState(DEFAULT_MIN_LENGTH);
  const [separator] = useState<Separator>("-");
  const [mode] = useState<GenerateOptions["mode"]>("reproducible");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [deriving, setDeriving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (phrase.trim() === "") {
      setResult(null);
      setDeriving(false);
      setCopied(false);
      return;
    }

    let ignore = false;
    setDeriving(true);
    setCopied(false);

    const timer = window.setTimeout(() => {
      void generatePassword({
        phrase,
        site,
        secret,
        minLength,
        separator,
        mode,
      })
        .then((next) => {
          if (ignore) return;
          setResult(next);
          setDeriving(false);
        })
        .catch(() => {
          if (ignore) return;
          setResult({ ok: false, reason: "internal" });
          setDeriving(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [phrase, site, secret, minLength, separator, mode]);

  const password = result?.ok ? result.password : "";
  const length = result?.ok ? result.length : 0;
  const message = failureMessage(result);

  async function handleCopy() {
    if (!result?.ok) return;
    try {
      await navigator.clipboard.writeText(result.password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
        <header className="mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-900">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            Runs only in your browser
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Passy
          </h1>
          <p className="mt-2 text-lg text-stone-600">
            A password that looks like your phrase.
          </p>
        </header>

        <div className="space-y-5">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <label
              htmlFor={phraseId}
              className="block text-base font-semibold text-stone-900"
            >
              Phrase you'll remember
            </label>
            <input
              id={phraseId}
              type="text"
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              maxLength={256}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="mt-2 block min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-lg text-stone-900 shadow-inner outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
              placeholder="my dog loves bacon"
            />
            <p className="mt-2 text-sm text-stone-600">
              A few words you already remember. The result keeps their shape.
            </p>
          </section>

          <PasswordOutput
            password={password}
            length={length}
            minLength={minLength}
            deriving={deriving}
            hidden={hidden}
            copied={copied}
            notices={result?.ok ? result.notices : []}
            onToggleHidden={() => setHidden((value) => !value)}
            onCopy={() => void handleCopy()}
          />

          <ClassChips classes={result?.ok ? result.classes : null} />

          {message && (
            <p
              role="status"
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
            >
              {message}
            </p>
          )}

          <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
            <strong className="font-semibold">
              Memorable is not the same as strong.
            </strong>{" "}
            Use a password manager for email, banking, and work accounts.
          </p>
        </div>
      </main>
    </div>
  );
}
