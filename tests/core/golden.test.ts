import { describe, expect, it } from "vitest";
import { computeOutput } from "../../src/core/generate";
import type { GenerateOptions } from "../../src/core/types";

const base: GenerateOptions = {
  phrase: "",
  site: "",
  secret: "",
  minLength: 16,
  separator: "-",
  mode: "reproducible",
};

const vectors: { options: GenerateOptions; output: string }[] = [
  {
    options: { ...base, phrase: "password", site: "forum" },
    output: "p@55w0rd-4$$G6k2",
  },
  {
    options: { ...base, phrase: "hello world", site: "shop" },
    output: "he110-w0rld-dE)d",
  },
  {
    options: { ...base, phrase: "cat", site: "news" },
    output: "c@7-nGIIImS@RzBn",
  },
  {
    options: { ...base, phrase: "blue fox drinks coffee", site: "mail" },
    output: "blu3-f0x-dR1nk5-coffee",
  },
  {
    options: {
      ...base,
      phrase: "password",
      site: "forum",
      secret: "Blue Fox",
    },
    output: "p45sword-=uMvdHB",
  },
];

describe("v1 golden vectors", () => {
  for (const vector of vectors) {
    const label = `${vector.options.phrase} @ ${vector.options.site}${
      vector.options.secret ? ` + secret` : ""
    }`;
    it(`reproduces ${label}`, async () => {
      const result = await computeOutput(vector.options, 600_000);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.password).toBe(vector.output);
    });
  }
});
