import { FOOD_BANKS } from "@/api/food-bank/foodBank";
import { exactFoodIcon as iconFor } from "@/api/food-bank/findFoodIcon";
import type { ProfileId } from "@/api/food-bank/profiles";
import { Lang } from "@/i18n";

export type ProductFacts = {
  product_name?: string;
  generic_name?: string;
  brands?: string;
  categories_tags?: string[];
  [field: string]: unknown;
};

const MAX_CATEGORY_WORDS = 3;
const SHORT_CATEGORY_WORDS = 2;
const MAX_NAME_LENGTH = 60;

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const singular = (text: string) =>
  normalize(text)
    .split(" ")
    .map((word) => (word.length > 3 ? word.replace(/[sx]$/, "") : word))
    .join(" ");

const bankNames = (lang: Lang) =>
  new Map(FOOD_BANKS[lang].map((item) => [singular(item.name), item.name]));

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const tidy = (name: string) => {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "";
};

const categoriesOf = (product: ProductFacts, lang: Lang) => {
  const localized = product[`categories_tags_${lang}`];
  const tags = Array.isArray(localized) ? localized : (product.categories_tags ?? []);
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .filter((tag) => !/^[a-z]{2}:/.test(tag) || tag.startsWith(`${lang}:`))
    .map((tag) => tag.replace(/^[a-z]{2}:/, "").replace(/-/g, " ").trim())
    .filter(Boolean)
    .reverse();
};

export const basicName = (product: ProductFacts, lang: Lang): string | null => {
  const bank = bankNames(lang);
  const brands = new Set(text(product.brands).split(",").map(normalize).filter(Boolean));
  const productName = text(product[`product_name_${lang}`]) || text(product.product_name);
  const genericName = text(product[`generic_name_${lang}`]) || text(product.generic_name);
  const categories = categoriesOf(product, lang).filter(
    (category) => !brands.has(normalize(category)) && normalize(category) !== normalize(productName),
  );

  for (const candidate of [...categories, genericName, productName]) {
    const known = candidate && bank.get(singular(candidate));
    if (known) return known;
  }

  const specific = categories.slice(0, -1);
  const words = (category: string) => category.split(" ").length;
  const plain =
    specific.find((category) => words(category) <= SHORT_CATEGORY_WORDS) ??
    specific.find((category) => words(category) <= MAX_CATEGORY_WORDS) ??
    categories.find((category) => words(category) <= MAX_CATEGORY_WORDS);

  return tidy(plain || genericName || productName) || null;
};

const listOf = (value: unknown) =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const RULES: [ProfileId, { allergens?: RegExp; categories?: RegExp; ingredients?: RegExp }][] = [
  ["gluten", { allergens: /^en:gluten$/ }],
  ["dairy", { allergens: /^en:milk$/, categories: /^en:(dairies|milks|cheeses|yogurts|butters|creams)$/ }],
  ["fish", { allergens: /^en:fish$/, categories: /^en:(fishes|canned-fishes|fish-preparations|smoked-fishes)$/ }],
  [
    "shellfish",
    { allergens: /^en:(crustaceans|molluscs)$/, categories: /^en:(crustaceans|mollusc|molluscs|shellfish|shrimps|prawns)$/ },
  ],
  [
    "pork",
    {
      categories: /^en:(pork|hams|bacon|lardons|pork-sausages|dry-sausages|saucissons|prepared-pork-meats)$|(^|-)pork(-|$)/,
      ingredients: /^en:(pork|pork-meat|pork-fat|lard|bacon|ham|pork-gelatin)$/,
    },
  ],
  [
    "meat",
    {
      categories: /^en:(meats|meats-and-their-products|prepared-meats|poultries|chickens|beef|sausages|hams)$/,
      ingredients: /^en:(meat|beef|chicken|turkey|veal|lamb|duck|chicken-meat|beef-meat)$/,
    },
  ],
  ["alcohol", { categories: /^en:(alcoholic-beverages|beers|wines|spirits|ciders)$/ }],
  ["soda", { categories: /^en:(sodas|colas|carbonated-soft-drinks)$/ }],
];

export const dietTags = (product: ProductFacts): ProfileId[] => {
  const allergens = listOf(product.allergens_tags);
  const categories = listOf(product.categories_tags);
  const ingredients = listOf(product.ingredients_tags);
  const hit = (tags: string[], pattern?: RegExp) => !!pattern && tags.some((tag) => pattern.test(tag));
  const found = new Set(
    RULES.filter(
      ([, rule]) => hit(allergens, rule.allergens) || hit(categories, rule.categories) || hit(ingredients, rule.ingredients),
    ).map(([id]) => id),
  );
  if (found.has("pork")) found.add("meat");
  return [...found];
};

export const productIcon = (product: ProductFacts, lang: Lang, name: string): string | undefined => {
  const english = listOf(product.categories_tags)
    .filter((tag) => tag.startsWith("en:"))
    .map((tag) => tag.slice(3).replace(/-/g, " "))
    .reverse();
  for (const candidate of [name, ...categoriesOf(product, lang), ...english]) {
    const icon = iconFor(candidate);
    if (icon) return icon;
  }
  return undefined;
};

export const productQuantity = (product: ProductFacts): string | undefined => {
  const written = text(product.quantity);
  if (written) return written.slice(0, 40);
  const amount = Number(product.product_quantity);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return `${amount} ${text(product.product_quantity_unit) || "g"}`;
};
