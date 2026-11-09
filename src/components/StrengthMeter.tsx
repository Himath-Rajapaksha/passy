import { useEffect, useState } from "react";
import { estimateStrength, type StrengthResult } from "../core/entropy";

type Status = "idle" | "loading" | "ready";

export default function StrengthMeter({ phrase }: { phrase: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [strength, setStrength] = useState<StrengthResult | null>(null);

  useEffect(() => {
    if (phrase.trim() === "") {
      setStatus("idle");
      setStrength(null);
      return;
    }

    let ignore = false;
    setStatus("loading");
    setStrength(null);

    estimateStrength(phrase)
      .then((result) => {
        if (ignore) return;
        setStrength(result);
        setStatus("ready");
      })
      .catch(() => {
        if (ignore) return;
        setStatus("idle");
      });

    return () => {
      ignore = true;
    };
  }, [phrase]);

  const score = strength?.score ?? -1;

  return (
    <section
      aria-labelledby="strength-heading"
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="strength-heading"
          className="text-sm font-semibold uppercase tracking-wide text-stone-500"
        >
          Source strength
        </h2>
        <p
          aria-live="polite"
          className={`text-sm font-semibold ${
            strength?.warning ? "text-amber-900" : "text-stone-700"
          }`}
        >
          {status === "loading"
            ? "Estimating…"
            : status === "ready" && strength
              ? strength.label
              : "Waiting for a phrase"}
        </p>
      </div>

      <div aria-hidden="true" className="mt-3 grid grid-cols-5 gap-1.5">
        {[0, 1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-2 rounded-full ${
              score >= step
                ? score <= 1
                  ? "bg-amber-600"
                  : score === 2
                    ? "bg-orange-500"
                    : "bg-emerald-600"
                : "bg-stone-200"
            }`}
          />
        ))}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        This estimates the phrase itself. Substitutions and padding look complex
        but add no real entropy. Use a password manager for anything valuable.
      </p>

      {status === "ready" && strength?.warning && (
        <p className="mt-2 text-sm font-medium text-amber-900">
          Treat this as memorable, not bank-grade.
        </p>
      )}
    </section>
  );
}
