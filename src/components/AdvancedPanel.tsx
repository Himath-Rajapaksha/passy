import { useId, useState } from "react";
import { ALGORITHM_VERSION, MAX_MIN_LENGTH, MIN_LENGTH } from "../core/constants";
import type { Mode, Separator } from "../core/types";

type AdvancedPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minLength: number;
  onMinLengthChange: (value: number) => void;
  separator: Separator;
  onSeparatorChange: (value: Separator) => void;
  mode: Mode;
  onModeChange: (value: Mode) => void;
  secret: string;
  onSecretChange: (value: string) => void;
};

export default function AdvancedPanel({
  open,
  onOpenChange,
  minLength,
  onMinLengthChange,
  separator,
  onSeparatorChange,
  mode,
  onModeChange,
  secret,
  onSecretChange,
}: AdvancedPanelProps) {
  const panelId = useId();
  const minLengthId = useId();
  const separatorId = useId();
  const secretId = useId();
  const [secretVisible, setSecretVisible] = useState(false);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left font-semibold text-stone-800 transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        <span>Advanced options</span>
        <span aria-hidden="true" className="text-xl leading-none text-stone-500">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="space-y-6 border-t border-stone-200 px-5 py-5"
        >
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor={minLengthId}
                className="font-medium text-stone-900"
              >
                Minimum length
              </label>
              <output
                htmlFor={minLengthId}
                className="rounded bg-stone-100 px-2 py-0.5 font-mono text-sm text-stone-800"
              >
                {minLength}
              </output>
            </div>
            <input
              id={minLengthId}
              type="range"
              min={MIN_LENGTH}
              max={MAX_MIN_LENGTH}
              step={1}
              value={minLength}
              onChange={(event) =>
                onMinLengthChange(
                  Math.min(
                    MAX_MIN_LENGTH,
                    Math.max(MIN_LENGTH, Number(event.target.value)),
                  ),
                )
              }
              className="mt-3 w-full accent-emerald-700"
            />
            <p className="mt-1 text-sm text-stone-600">
              Between {MIN_LENGTH} and {MAX_MIN_LENGTH} characters.
            </p>
          </div>

          <div>
            <label
              htmlFor={separatorId}
              className="block font-medium text-stone-900"
            >
              Separator
            </label>
            <select
              id={separatorId}
              value={separator}
              onChange={(event) =>
                onSeparatorChange(event.target.value as Separator)
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="-">Hyphen ( - )</option>
              <option value="_">Underscore ( _ )</option>
              <option value=".">Dot ( . )</option>
              <option value="">None</option>
            </select>
          </div>

          <fieldset>
            <legend className="font-medium text-stone-900">Mode</legend>
            <div className="mt-2 space-y-2">
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-stone-200 px-3 py-2">
                <input
                  type="radio"
                  name="mode"
                  value="reproducible"
                  checked={mode === "reproducible"}
                  onChange={() => onModeChange("reproducible")}
                  className="h-4 w-4 accent-emerald-700"
                />
                <span>
                  <span className="font-medium text-stone-900">
                    Reproducible
                  </span>
                  <span className="block text-sm text-stone-600">
                    Same inputs always give the same password.
                  </span>
                </span>
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-stone-200 px-3 py-2">
                <input
                  type="radio"
                  name="mode"
                  value="session-random"
                  checked={mode === "session-random"}
                  onChange={() => onModeChange("session-random")}
                  className="h-4 w-4 accent-emerald-700"
                />
                <span>
                  <span className="font-medium text-stone-900">
                    Session-random
                  </span>
                  <span className="block text-sm text-stone-600">
                    Adds randomness, but you cannot reproduce it later.
                  </span>
                </span>
              </label>
            </div>
            {mode === "session-random" && (
              <p
                role="status"
                className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
              >
                Not reproducible: reloading the page gives a different
                password.
              </p>
            )}
          </fieldset>

          <div>
            <label
              htmlFor={secretId}
              className="block font-medium text-stone-900"
            >
              Extra secret (optional)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id={secretId}
                type={secretVisible ? "text" : "password"}
                value={secret}
                onChange={(event) => onSecretChange(event.target.value)}
                maxLength={128}
                autoComplete="off"
                spellCheck={false}
                className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
              />
              <button
                type="button"
                onClick={() => setSecretVisible((value) => !value)}
                className="min-h-11 shrink-0 rounded-lg border border-stone-300 px-3 py-2 font-medium text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                {secretVisible ? "Hide secret" : "Show secret"}
              </button>
            </div>
            <p className="mt-2 text-sm text-stone-600">
              One more word only you know. Case and spaces inside the secret
              matter. If you forget it, the password changes.
            </p>
          </div>

          <p className="border-t border-stone-200 pt-4 text-sm text-stone-500">
            Algorithm version{" "}
            <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-stone-700">
              {ALGORITHM_VERSION}
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
