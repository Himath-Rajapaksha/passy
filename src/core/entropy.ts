import type { ZxcvbnResult } from "@zxcvbn-ts/core";

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export type StrengthResult = {
  score: StrengthScore;
  label: string;
  warning: boolean;
};

type ZxcvbnInstance = {
  check: (password: string) => Pick<ZxcvbnResult, "score">;
};

let instancePromise: Promise<ZxcvbnInstance> | null = null;

async function loadZxcvbn(): Promise<ZxcvbnInstance> {
  if (!instancePromise) {
    instancePromise = (async () => {
      const [core, common, en] = await Promise.all([
        import("@zxcvbn-ts/core"),
        import("@zxcvbn-ts/language-common"),
        import("@zxcvbn-ts/language-en"),
      ]);
      return new core.ZxcvbnFactory({
        dictionary: { ...common.dictionary, ...en.dictionary },
        graphs: common.adjacencyGraphs,
        translations: en.translations,
      });
    })();
  }
  return instancePromise;
}

export function labelForScore(score: StrengthScore): string {
  switch (score) {
    case 0:
    case 1:
      return "Very weak — memorable only";
    case 2:
      return "Weak";
    case 3:
      return "Okay for low-risk sites";
    case 4:
      return "Good phrase";
  }
}

export async function estimateStrength(
  phrase: string,
): Promise<StrengthResult> {
  const zxcvbn = await loadZxcvbn();
  const { score } = zxcvbn.check(phrase);
  return {
    score,
    label: labelForScore(score),
    warning: score <= 2,
  };
}
