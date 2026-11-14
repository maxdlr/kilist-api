/* global process, console, fetch, URL */
import { readFile, writeFile } from "node:fs/promises";

const SOURCE = "https://static.openfoodfacts.org/data/taxonomies/categories.json";
const OUTPUT = new URL("../src/api/food-bank/foodTaxonomy.generated.ts", import.meta.url);
const LANGS = ["en", "fr"];
const MIN_ROWS = 10000;

const RULES = [
  ["baby", ["en:baby-foods", "en:baby-milks"]],
  ["frozen", ["en:frozen-foods", "en:ice-creams-and-sorbets", "en:frozen-desserts"]],
  ["pantry", ["en:canned-foods", "en:canned-vegetables", "en:canned-fruits", "en:canned-plant-based-foods", "en:dried-products", "en:broths", "en:dehydrated-soups"]],
  ["bakery", ["en:breads", "en:viennoiseries", "en:pastries", "en:brioches", "en:bread-rolls"]],
  ["sweet", [
    "en:sweet-snacks", "en:biscuits-and-cakes", "en:cocoa-and-its-products", "en:breakfast-cereals",
    "en:sweet-spreads", "en:sweeteners", "en:bee-products", "en:confectioneries", "en:sweet-pies",
    "en:crepes-and-pancakes", "en:jams", "en:fruit-preserves", "en:compotes", "en:food-decorations",
    "en:pastry-helpers", "en:dessert-mixes", "en:flours",
  ]],
  ["dairy", [
    "en:dairies", "en:eggs", "en:eggs-and-their-products", "en:dairy-substitutes", "en:milk-substitutes",
    "en:cheese-substitutes", "en:plant-based-creams", "en:margarines", "en:dairy-desserts",
  ]],
  ["drinks", ["en:beverages", "en:coffees", "en:teas", "en:syrups", "en:herbal-teas", "en:beverages-and-beverages-preparations"]],
  ["meals", ["en:meals", "en:sandwiches", "en:pizzas-pies-and-quiches", "en:meal-kits", "en:skewers", "en:meat-alternatives"]],
  ["fish", ["en:seafood", "en:fishes-and-their-products", "en:caviar-substitutes"]],
  ["meat", ["en:meats-and-their-products", "en:terrines", "en:fish-and-meat-and-eggs"]],
  ["sweet", ["en:desserts", "en:breakfasts"]],
  ["pantry", [
    "en:sauces", "en:pickles", "en:olive-tree-products", "en:nuts-and-their-products", "en:seeds", "en:dried-fruits",
    "en:fats", "en:pastas", "en:pastas-and-dumplings", "en:rices", "en:cereals-and-their-products",
    "en:cereal-grains", "en:spices", "en:chips-and-fries", "en:salty-snacks", "en:purees", "en:pulses",
    "en:vegetable-oils", "en:vinegars", "en:mustards", "en:salts",
  ]],
  ["produce", [
    "en:fruits", "en:vegetables", "en:fresh-foods", "en:herbs", "en:culinary-plants", "en:aromatic-plants",
    "en:mushrooms-and-their-products", "en:potatoes", "en:fresh-plant-based-foods",
    "en:fruits-and-vegetables-based-foods", "en:vegetables-based-foods",
  ]],
  ["pantry", [
    "en:condiments", "en:legumes-and-their-products", "en:snacks", "en:cooking-helpers", "en:plant-based-spreads",
    "en:salted-spreads", "en:biscuits-and-crackers", "en:food-additives", "en:dietary-supplements",
    "en:sauerkrauts", "en:fermented-foods", "en:spreads", "en:plant-based-foods-and-beverages", "en:plant-based-foods",
  ]],
];

const load = async () => {
  const local = process.argv[2];
  if (local) return JSON.parse(await readFile(local, "utf8"));
  const response = await fetch(SOURCE, { headers: { "User-Agent": "taxonomy-import/1.0" } });
  if (!response.ok) throw new Error(`taxonomy download failed: ${response.status}`);
  return response.json();
};

const taxonomy = await load();
const missing = RULES.flatMap(([, tags]) => tags).filter((tag) => !taxonomy[tag]);
if (missing.length > 0) console.warn(`unknown rule tags: ${missing.join(", ")}`);

const ancestors = new Map();
const ancestorsOf = (tag) => {
  if (ancestors.has(tag)) return ancestors.get(tag);
  const found = new Set([tag]);
  ancestors.set(tag, found);
  for (const parent of taxonomy[tag]?.parents ?? []) {
    for (const above of ancestorsOf(parent)) found.add(above);
  }
  return found;
};

const depths = new Map();
const depthOf = (tag) => {
  if (depths.has(tag)) return depths.get(tag);
  depths.set(tag, 0);
  const parents = (taxonomy[tag]?.parents ?? []).filter((parent) => taxonomy[parent]);
  const depth = parents.length === 0 ? 0 : 1 + Math.min(...parents.map(depthOf));
  depths.set(tag, depth);
  return depth;
};

const aisleOf = (tag) => {
  const above = ancestorsOf(tag);
  return RULES.find(([, tags]) => tags.some((ruleTag) => above.has(ruleTag)))?.[0] ?? null;
};

const rows = Object.keys(taxonomy)
  .map((tag) => ({ tag, aisle: aisleOf(tag), depth: depthOf(tag), name: taxonomy[tag].name ?? {} }))
  .filter((row) => row.aisle)
  .sort((a, b) => a.depth - b.depth || a.tag.localeCompare(b.tag));

if (rows.length < MIN_ROWS) throw new Error(`only ${rows.length} categories found, keeping the current file`);

const lines = rows.map((row) =>
  JSON.stringify([row.tag, row.aisle, ...LANGS.map((lang) => row.name[lang]?.trim() || null)]),
);

await writeFile(
  OUTPUT,
  [
    'import type { AisleId } from "./aisles";',
    "",
    "export const FOOD_TAXONOMY: [tag: string, aisle: AisleId, en: string | null, fr: string | null][] = [",
    ...lines.map((line) => `  ${line},`),
    "];",
    "",
  ].join("\n"),
);
console.log(`${rows.length} categories written, ${Object.keys(taxonomy).length - rows.length} without an aisle`);
