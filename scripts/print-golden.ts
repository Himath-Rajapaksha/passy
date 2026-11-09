import { computeOutput } from "../src/core/generate";
import type { GenerateOptions } from "../src/core/types";

const base: GenerateOptions = {
  phrase: "",
  site: "",
  secret: "",
  minLength: 16,
  separator: "-",
  mode: "reproducible",
};

const vectors: GenerateOptions[] = [
  { ...base, phrase: "password", site: "forum" },
  { ...base, phrase: "hello world", site: "shop" },
  { ...base, phrase: "cat", site: "news" },
  { ...base, phrase: "blue fox drinks coffee", site: "mail" },
  { ...base, phrase: "password", site: "forum", secret: "Blue Fox" },
];

for (const options of vectors) {
  const result = await computeOutput(options, 600_000);
  const output = result.ok ? result.password : `ERROR:${result.reason}`;
  console.log(
    JSON.stringify({
      phrase: options.phrase,
      site: options.site,
      secret: options.secret,
      minLength: options.minLength,
      separator: options.separator,
      mode: options.mode,
      output,
    }),
  );
}
