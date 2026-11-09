import type { ClassSet } from "../core/types";

const LABELS: { key: keyof ClassSet; label: string }[] = [
  { key: "lowercase", label: "lowercase" },
  { key: "uppercase", label: "uppercase" },
  { key: "digit", label: "digit" },
  { key: "symbol", label: "symbol" },
];

export default function ClassChips({ classes }: { classes: ClassSet | null }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Character classes">
      {LABELS.map(({ key, label }) => {
        const present = classes?.[key] ?? false;
        return (
          <li
            key={key}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${
              present
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-stone-200 bg-white text-stone-500"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                present ? "bg-emerald-500" : "bg-stone-300"
              }`}
            />
            {label}
            <span className="sr-only">
              {present ? "present" : "missing"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
