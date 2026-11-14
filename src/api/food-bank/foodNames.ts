import { Lang, LANGS } from "@/i18n";
import type { AisleId } from "./aisles";
import { FOOD_BANKS, normalizeFoodName } from "./foodBank";
import { FOOD_TAXONOMY } from "./foodTaxonomy.generated";

const MAX_WORDS = 4;
const MAX_LENGTH = 40;
const TOO_BROAD =
  /\d|%|\b(products?|produits|dérivés|foods?|aliments|beverages|preparations|préparations|variety|assortiments?|based|à base|and|et)\b/i;

const COLUMN: Record<Lang, 2 | 3> = { en: 2, fr: 3 };

const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

const namesFor = (lang: Lang) => {
  const taken = new Set(FOOD_BANKS[lang].map((item) => normalizeFoodName(item.name)));
  const byAisle: Partial<Record<AisleId, string[]>> = {};

  for (const row of FOOD_TAXONOMY) {
    const name = row[COLUMN[lang]];
    if (!name || name.length > MAX_LENGTH || name.split(" ").length > MAX_WORDS || TOO_BROAD.test(name)) continue;
    const normalized = normalizeFoodName(name);
    if (taken.has(normalized)) continue;
    taken.add(normalized);
    (byAisle[row[1]] ??= []).push(capitalize(name));
  }

  return byAisle;
};

export const FOOD_NAMES = Object.fromEntries(LANGS.map((lang) => [lang, namesFor(lang)])) as Record<
  Lang,
  Partial<Record<AisleId, string[]>>
>;

const aisleByTag = new Map(FOOD_TAXONOMY.map((row) => [row[0], row[1]]));

export const aisleOfTags = (tags: unknown): AisleId | null => {
  if (!Array.isArray(tags)) return null;
  for (let index = tags.length - 1; index >= 0; index--) {
    const aisle = aisleByTag.get(tags[index]);
    if (aisle) return aisle;
  }
  return null;
};
