import { useEffect, useId, useRef, useState } from "react";
import AdvancedPanel from "./components/AdvancedPanel";
import ClassChips from "./components/ClassChips";
import PasswordOutput from "./components/PasswordOutput";
import RandomMode from "./components/RandomMode";
import StrengthMeter from "./components/StrengthMeter";
import { DEFAULT_MIN_LENGTH } from "./core/constants";
import { generatePassword } from "./core/generate";
import type { GenerateResult, Mode, Separator } from "./core/types";

const DEBOUNCE_MS = 200;

type ModeTab = "phrase" | "random";

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
  const siteId = useId();
  const phraseTabId = useId();
  const phrasePanelId = useId();
  const randomTabId = useId();
  const randomPanelId = useId();
  const phraseTabRef = useRef<HTMLButtonElement>(null);
  const randomTabRef = useRef<HTMLButtonElement>(null);
  const [tab, setTab] = useState<ModeTab>("phrase");
  const [phrase, setPhrase] = useState("");
  const [site, setSite] = useState("");
  const [secret, setSecret] = useState("");
  const [minLength, setMinLength] = useState(DEFAULT_MIN_LENGTH);
  const [separator, setSeparator] = useState<Separator>("-");
  const [mode, setMode] = useState<Mode>("reproducible");
  const [advancedOpen, setAdvancedOpen] = useState(false);
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

  function activateTab(next: ModeTab, moveFocus = false) {
    setTab(next);
    if (moveFocus) {
      const target = next === "phrase" ? phraseTabRef : randomTabRef;
      target.current?.focus();
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

        <div
          role="tablist"
          aria-label="Password mode"
          onKeyDown={(event) => {
            if (
              event.key === "ArrowLeft" ||
              event.key === "ArrowRight" ||
              event.key === "Home" ||
              event.key === "End"
            ) {
              event.preventDefault();
              activateTab(
                event.key === "ArrowLeft" || event.key === "Home"
                  ? "phrase"
                  : "random",
                true,
              );
            }
          }}
          className="grid grid-cols-2 gap-1 rounded-xl bg-stone-200/80 p-1"
        >
          <button
            ref={phraseTabRef}
            type="button"
            role="tab"
            id={phraseTabId}
            aria-selected={tab === "phrase"}
            aria-controls={phrasePanelId}
            tabIndex={tab === "phrase" ? 0 : -1}
            onClick={() => activateTab("phrase")}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
              tab === "phrase"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Phrase
          </button>
          <button
            ref={randomTabRef}
            type="button"
            role="tab"
            id={randomTabId}
            aria-selected={tab === "random"}
            aria-controls={randomPanelId}
            tabIndex={tab === "random" ? 0 : -1}
            onClick={() => activateTab("random")}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
              tab === "random"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Random
          </button>
        </div>

        {tab === "phrase" ? (
          <div
            role="tabpanel"
            id={phrasePanelId}
            aria-label="Mnemonic password"
            className="mt-5 space-y-5"
          >
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

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <label
              htmlFor={siteId}
              className="block text-base font-semibold text-stone-900"
            >
              Site or app (recommended)
            </label>
            <input
              id={siteId}
              type="text"
              value={site}
              onChange={(event) => setSite(event.target.value)}
              maxLength={64}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="mt-2 block min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-lg text-stone-900 shadow-inner outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
              placeholder="hobby forum"
            />
            <p className="mt-2 text-sm text-stone-600">
              The same phrase gives a different password on each site.
            </p>
            {phrase.trim() !== "" && site.trim() === "" && (
              <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                Add a site name so the same phrase doesn't give the same
                password everywhere.
              </p>
            )}
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

          {mode === "session-random" && (
            <p
              role="status"
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
            >
              <strong className="font-semibold">Session-random mode.</strong>{" "}
              Save this password now: reloading the page gives a different one.
            </p>
          )}

          <ClassChips classes={result?.ok ? result.classes : null} />

          <StrengthMeter phrase={phrase} />

          <AdvancedPanel
            open={advancedOpen}
            onOpenChange={setAdvancedOpen}
            minLength={minLength}
            onMinLengthChange={setMinLength}
            separator={separator}
            onSeparatorChange={setSeparator}
            mode={mode}
            onModeChange={setMode}
            secret={secret}
            onSecretChange={setSecret}
          />

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
        ) : (
          <div
            role="tabpanel"
            id={randomPanelId}
            aria-label="Random password"
            className="mt-5 space-y-5"
          >
            <RandomMode />
          </div>
        )}
      </main>
    </div>
  );
}
