import Fuse from "fuse.js";
import { FOOD_ICON_ALIASES } from "./foodIconAliases";

const FUZZY_THRESHOLD = 0.2;
const FUZZY_MIN_LENGTH = 4;

const singularize = (word: string): string => {
  if (word.length <= 3 || word.endsWith("ss")) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (/(oes|ches|shes|xes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
};

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .map(singularize)
    .join(" ");

const iconByAlias = new Map(
  Object.entries(FOOD_ICON_ALIASES).flatMap(([icon, aliases]) =>
    aliases.map((alias): [string, string] => [normalize(alias), icon]),
  ),
);

const fuse = new Fuse([...iconByAlias.keys()], {
  includeScore: true,
  threshold: FUZZY_THRESHOLD,
});

const findFoodIcon = (name: string): string | undefined => {
  const normalized = normalize(name);
  if (!normalized) return undefined;

  const exact = iconByAlias.get(normalized);
  if (exact) return exact;

  const words = normalized.split(" ");
  for (let i = words.length - 1; i >= 0; i--) {
    const bigram = i > 0 ? `${words.at(i - 1)} ${words.at(i)}` : undefined;
    const icon =
      (bigram && iconByAlias.get(bigram)) ?? iconByAlias.get(words.at(i)!);
    if (icon) return icon;
  }

  if (normalized.length < FUZZY_MIN_LENGTH) return undefined;

  const [best] = fuse.search(normalized);
  return best ? iconByAlias.get(best.item) : undefined;
};

export default findFoodIcon;
