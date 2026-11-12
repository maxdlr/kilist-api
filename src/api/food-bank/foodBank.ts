import { Lang, LANGS } from "@/i18n";
import findFoodIcon from "./findFoodIcon";
import type { ProfileId } from "./profiles";

export type FoodBankItem = {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  staple?: boolean;
  tags?: ProfileId[];
  group?: ProfileId;
  months?: number[];
};

type Entry = {
  key: string;
  en?: string;
  fr?: string;
  tags?: ProfileId[];
  group?: ProfileId;
  extra?: boolean | Lang[];
  months?: number[];
};

const ENTRIES: Entry[] = [
  { key: "pasta", en: "Pasta", fr: "Pâtes", tags: ["gluten"] },
  { key: "rice", en: "Rice", fr: "Riz" },
  { key: "bread", en: "Bread", tags: ["gluten"] },
  { key: "baguette", fr: "Baguette", tags: ["gluten"] },
  { key: "sandwich-bread", fr: "Pain de mie", tags: ["gluten"] },
  { key: "milk", en: "Milk", fr: "Lait", tags: ["dairy"] },
  { key: "eggs", en: "Eggs", fr: "Œufs", tags: ["egg"] },
  { key: "butter", en: "Butter", fr: "Beurre", tags: ["dairy"] },
  { key: "cheese", en: "Cheese", tags: ["dairy"] },
  { key: "grated-emmental", fr: "Emmental râpé", tags: ["dairy"] },
  { key: "yogurt", en: "Yogurt", fr: "Yaourts", tags: ["dairy"] },
  { key: "creme-fraiche", fr: "Crème fraîche", tags: ["dairy"] },
  { key: "chicken", en: "Chicken", fr: "Poulet", tags: ["meat"] },
  { key: "ground-beef", en: "Ground beef", fr: "Steak haché", tags: ["meat"] },
  { key: "ham", en: "Ham", fr: "Jambon", tags: ["meat", "pork"] },
  { key: "bacon", en: "Bacon", tags: ["meat", "pork"] },
  { key: "lardons", fr: "Lardons", tags: ["meat", "pork"] },
  { key: "canned-tuna", en: "Canned tuna", fr: "Thon en boîte", tags: ["fish"] },
  { key: "tomatoes", en: "Tomatoes", fr: "Tomates", months: [6, 7, 8, 9] },
  { key: "onions", en: "Onions", fr: "Oignons" },
  { key: "potatoes", en: "Potatoes", fr: "Pommes de terre" },
  { key: "garlic", en: "Garlic", fr: "Ail" },
  { key: "carrots", en: "Carrots", fr: "Carottes" },
  { key: "lettuce", en: "Lettuce", fr: "Salade", months: [4, 5, 6, 7, 8, 9, 10] },
  { key: "apples", en: "Apples", fr: "Pommes" },
  { key: "bananas", en: "Bananas", fr: "Bananes" },
  { key: "lemons", en: "Lemons", fr: "Citrons" },
  { key: "olive-oil", en: "Olive oil", fr: "Huile d'olive" },
  { key: "salt", en: "Salt", fr: "Sel" },
  { key: "sugar", en: "Sugar", fr: "Sucre" },
  { key: "cereal", en: "Cereal", fr: "Céréales", tags: ["gluten"], extra: ["fr"] },
  { key: "mustard", en: "Mustard", fr: "Moutarde", extra: ["en"] },
  { key: "salmon", en: "Salmon", fr: "Saumon", tags: ["fish"], extra: true },
  { key: "shrimp", en: "Shrimp", fr: "Crevettes", tags: ["shellfish"], extra: true },
  { key: "sausages", en: "Sausages", fr: "Saucisses", tags: ["meat", "pork"], extra: true },
  { key: "orange-juice", en: "Orange juice", fr: "Jus d'orange", extra: true },
  { key: "cola", en: "Cola", fr: "Cola", tags: ["soda"], extra: true },
  { key: "lemonade", en: "Lemonade", fr: "Limonade", tags: ["soda"], extra: true },
  { key: "beer", en: "Beer", fr: "Bière", tags: ["alcohol", "gluten"], extra: true },
  { key: "wine", en: "Wine", fr: "Vin", tags: ["alcohol"], extra: true },
  { key: "chocolate", en: "Chocolate", fr: "Chocolat", extra: true },
  { key: "honey", en: "Honey", fr: "Miel", extra: true },
  { key: "jam", en: "Jam", fr: "Confiture", extra: true },
  { key: "ketchup", en: "Ketchup", fr: "Ketchup", extra: true },
  { key: "canned-tomatoes", en: "Canned tomatoes", fr: "Tomates pelées", extra: true },
  { key: "frozen-peas", en: "Frozen peas", fr: "Petits pois surgelés", extra: true },
  { key: "chickpeas", en: "Chickpeas", fr: "Pois chiches", extra: true },
  { key: "lentils", en: "Lentils", fr: "Lentilles", extra: true },
  { key: "oat-milk", en: "Oat milk", fr: "Lait d'avoine", extra: true },
  { key: "tofu", en: "Tofu", fr: "Tofu", tags: ["soy"], extra: true },
  { key: "peanut-butter", en: "Peanut butter", tags: ["peanut"], extra: true },
  { key: "mushrooms", en: "Mushrooms", fr: "Champignons", extra: true },
  { key: "cucumber", en: "Cucumber", fr: "Concombre", extra: true, months: [5, 6, 7, 8, 9] },
  { key: "bell-peppers", en: "Bell peppers", fr: "Poivrons", extra: true, months: [6, 7, 8, 9] },
  { key: "oranges", en: "Oranges", fr: "Oranges", extra: true, months: [11, 12, 1, 2, 3] },
  { key: "strawberries", en: "Strawberries", fr: "Fraises", extra: true, months: [4, 5, 6, 7] },
  { key: "tea", en: "Tea", fr: "Thé", extra: true },
  { key: "sparkling-water", en: "Sparkling water", fr: "Eau gazeuse", extra: true },
  { key: "comte", fr: "Comté", tags: ["dairy"], extra: true },
  { key: "coffee", en: "Coffee", fr: "Café", group: "coffee" },
  { key: "coffee-filters", en: "Coffee filters", fr: "Filtres à café", group: "coffee" },
  { key: "diapers", en: "Diapers", fr: "Couches", group: "baby" },
  { key: "baby-food", en: "Baby food", fr: "Petits pots", group: "baby" },
  { key: "baby-wipes", en: "Baby wipes", fr: "Lingettes bébé", group: "baby" },
  { key: "cat-food", en: "Cat food", fr: "Croquettes pour chat", group: "cat" },
  { key: "cat-litter", en: "Cat litter", fr: "Litière", group: "cat" },
  { key: "dog-food", en: "Dog food", fr: "Croquettes pour chien", group: "dog" },
  { key: "flour", en: "Flour", fr: "Farine", group: "baking", tags: ["gluten"] },
  { key: "baking-powder", en: "Baking powder", fr: "Levure chimique", group: "baking" },
  { key: "yeast", en: "Yeast", group: "baking" },
  { key: "vanilla-sugar", fr: "Sucre vanillé", group: "baking" },
  { key: "dark-chocolate", en: "Dark chocolate", fr: "Chocolat pâtissier", group: "baking" },
];

const isExtra = (entry: Entry, lang: Lang) =>
  Array.isArray(entry.extra) ? entry.extra.includes(lang) : entry.extra === true;

const toItems = (lang: Lang): FoodBankItem[] =>
  ENTRIES.filter((entry) => entry[lang]).map((entry) => ({
    key: entry.key,
    name: entry[lang]!,
    icon: findFoodIcon(entry[lang]!),
    ...(!isExtra(entry, lang) && !entry.group && { staple: true }),
    ...(entry.tags && { tags: entry.tags }),
    ...(entry.group && { group: entry.group }),
    ...(entry.months && { months: entry.months }),
  }));

export const FOOD_BANKS: Record<Lang, FoodBankItem[]> = {
  en: toItems("en"),
  fr: toItems("fr"),
};

export const normalizeFoodName = (name: string) => name.trim().toLowerCase();

const keyByName = new Map(
  ENTRIES.flatMap((entry) =>
    LANGS.filter((lang) => entry[lang]).map((lang): [string, string] => [normalizeFoodName(entry[lang]!), entry.key]),
  ),
);

export const foodKeyOf = (name: string) => {
  const normalized = normalizeFoodName(name);
  return keyByName.get(normalized) ?? normalized;
};

const FOOD_BANK = FOOD_BANKS.en;

export default FOOD_BANK;
