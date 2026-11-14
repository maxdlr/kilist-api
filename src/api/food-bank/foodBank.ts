import { Lang, LANGS } from "@/i18n";
import findFoodIcon from "./findFoodIcon";
import type { AisleId } from "./aisles";
import type { ProfileId } from "./profiles";

export type FoodBankItem = {
  key: string;
  name: string;
  aisle: AisleId;
  description?: string;
  icon?: string;
  staple?: boolean;
  tags?: ProfileId[];
  group?: ProfileId;
  months?: number[];
};

type Entry = {
  key: string;
  aisle: AisleId;
  en?: string;
  fr?: string;
  tags?: ProfileId[];
  group?: ProfileId;
  extra?: boolean | Lang[];
  months?: number[];
};

const ENTRIES: Entry[] = [
  { key: "pasta", aisle: "pantry", en: "Pasta", fr: "Pâtes", tags: ["gluten"] },
  { key: "rice", aisle: "pantry", en: "Rice", fr: "Riz" },
  { key: "bread", aisle: "bakery", en: "Bread", tags: ["gluten"] },
  { key: "baguette", aisle: "bakery", fr: "Baguette", tags: ["gluten"] },
  { key: "sandwich-bread", aisle: "bakery", fr: "Pain de mie", tags: ["gluten"] },
  { key: "milk", aisle: "dairy", en: "Milk", fr: "Lait", tags: ["dairy"] },
  { key: "eggs", aisle: "dairy", en: "Eggs", fr: "Œufs", tags: ["egg"] },
  { key: "butter", aisle: "dairy", en: "Butter", fr: "Beurre", tags: ["dairy"] },
  { key: "cheese", aisle: "dairy", en: "Cheese", tags: ["dairy"] },
  { key: "grated-emmental", aisle: "dairy", fr: "Emmental râpé", tags: ["dairy"] },
  { key: "yogurt", aisle: "dairy", en: "Yogurt", fr: "Yaourts", tags: ["dairy"] },
  { key: "creme-fraiche", aisle: "dairy", fr: "Crème fraîche", tags: ["dairy"] },
  { key: "chicken", aisle: "meat", en: "Chicken", fr: "Poulet", tags: ["meat"] },
  { key: "ground-beef", aisle: "meat", en: "Ground beef", fr: "Steak haché", tags: ["meat"] },
  { key: "ham", aisle: "meat", en: "Ham", fr: "Jambon", tags: ["meat", "pork"] },
  { key: "bacon", aisle: "meat", en: "Bacon", tags: ["meat", "pork"] },
  { key: "lardons", aisle: "meat", fr: "Lardons", tags: ["meat", "pork"] },
  { key: "canned-tuna", aisle: "pantry", en: "Canned tuna", fr: "Thon en boîte", tags: ["fish"] },
  { key: "tomatoes", aisle: "produce", en: "Tomatoes", fr: "Tomates", months: [6, 7, 8, 9] },
  { key: "onions", aisle: "produce", en: "Onions", fr: "Oignons" },
  { key: "potatoes", aisle: "produce", en: "Potatoes", fr: "Pommes de terre" },
  { key: "garlic", aisle: "produce", en: "Garlic", fr: "Ail" },
  { key: "carrots", aisle: "produce", en: "Carrots", fr: "Carottes" },
  { key: "lettuce", aisle: "produce", en: "Lettuce", fr: "Salade", months: [4, 5, 6, 7, 8, 9, 10] },
  { key: "apples", aisle: "produce", en: "Apples", fr: "Pommes" },
  { key: "bananas", aisle: "produce", en: "Bananas", fr: "Bananes" },
  { key: "lemons", aisle: "produce", en: "Lemons", fr: "Citrons" },
  { key: "olive-oil", aisle: "pantry", en: "Olive oil", fr: "Huile d'olive" },
  { key: "salt", aisle: "pantry", en: "Salt", fr: "Sel" },
  { key: "sugar", aisle: "sweet", en: "Sugar", fr: "Sucre" },
  { key: "cereal", aisle: "sweet", en: "Cereal", fr: "Céréales", tags: ["gluten"], extra: ["fr"] },
  { key: "mustard", aisle: "pantry", en: "Mustard", fr: "Moutarde", extra: ["en"] },
  { key: "salmon", aisle: "fish", en: "Salmon", fr: "Saumon", tags: ["fish"], extra: true },
  { key: "shrimp", aisle: "fish", en: "Shrimp", fr: "Crevettes", tags: ["shellfish"], extra: true },
  { key: "sausages", aisle: "meat", en: "Sausages", fr: "Saucisses", tags: ["meat", "pork"], extra: true },
  { key: "orange-juice", aisle: "drinks", en: "Orange juice", fr: "Jus d'orange", extra: true },
  { key: "cola", aisle: "drinks", en: "Cola", fr: "Cola", tags: ["soda"], extra: true },
  { key: "lemonade", aisle: "drinks", en: "Lemonade", fr: "Limonade", tags: ["soda"], extra: true },
  { key: "beer", aisle: "drinks", en: "Beer", fr: "Bière", tags: ["alcohol", "gluten"], extra: true },
  { key: "wine", aisle: "drinks", en: "Wine", fr: "Vin", tags: ["alcohol"], extra: true },
  { key: "chocolate", aisle: "sweet", en: "Chocolate", fr: "Chocolat", extra: true },
  { key: "honey", aisle: "sweet", en: "Honey", fr: "Miel", extra: true },
  { key: "jam", aisle: "sweet", en: "Jam", fr: "Confiture", extra: true },
  { key: "ketchup", aisle: "pantry", en: "Ketchup", fr: "Ketchup", extra: true },
  { key: "canned-tomatoes", aisle: "pantry", en: "Canned tomatoes", fr: "Tomates pelées", extra: true },
  { key: "frozen-peas", aisle: "frozen", en: "Frozen peas", fr: "Petits pois surgelés", extra: true },
  { key: "chickpeas", aisle: "pantry", en: "Chickpeas", fr: "Pois chiches", extra: true },
  { key: "lentils", aisle: "pantry", en: "Lentils", fr: "Lentilles", extra: true },
  { key: "oat-milk", aisle: "dairy", en: "Oat milk", fr: "Lait d'avoine", extra: true },
  { key: "tofu", aisle: "meals", en: "Tofu", fr: "Tofu", tags: ["soy"], extra: true },
  { key: "peanut-butter", aisle: "pantry", en: "Peanut butter", tags: ["peanut"], extra: true },
  { key: "mushrooms", aisle: "produce", en: "Mushrooms", fr: "Champignons", extra: true },
  { key: "cucumber", aisle: "produce", en: "Cucumber", fr: "Concombre", extra: true, months: [5, 6, 7, 8, 9] },
  { key: "bell-peppers", aisle: "produce", en: "Bell peppers", fr: "Poivrons", extra: true, months: [6, 7, 8, 9] },
  { key: "oranges", aisle: "produce", en: "Oranges", fr: "Oranges", extra: true, months: [11, 12, 1, 2, 3] },
  { key: "strawberries", aisle: "produce", en: "Strawberries", fr: "Fraises", extra: true, months: [4, 5, 6, 7] },
  { key: "tea", aisle: "drinks", en: "Tea", fr: "Thé", extra: true },
  { key: "sparkling-water", aisle: "drinks", en: "Sparkling water", fr: "Eau gazeuse", extra: true },
  { key: "comte", aisle: "dairy", fr: "Comté", tags: ["dairy"], extra: true },
  { key: "coffee", aisle: "drinks", en: "Coffee", fr: "Café", group: "coffee" },
  { key: "coffee-filters", aisle: "household", en: "Coffee filters", fr: "Filtres à café", group: "coffee" },
  { key: "diapers", aisle: "baby", en: "Diapers", fr: "Couches", group: "baby" },
  { key: "baby-food", aisle: "baby", en: "Baby food", fr: "Petits pots", group: "baby" },
  { key: "baby-wipes", aisle: "baby", en: "Baby wipes", fr: "Lingettes bébé", group: "baby" },
  { key: "cat-food", aisle: "pets", en: "Cat food", fr: "Croquettes pour chat", group: "cat" },
  { key: "cat-litter", aisle: "pets", en: "Cat litter", fr: "Litière", group: "cat" },
  { key: "dog-food", aisle: "pets", en: "Dog food", fr: "Croquettes pour chien", group: "dog" },
  { key: "flour", aisle: "sweet", en: "Flour", fr: "Farine", group: "baking", tags: ["gluten"] },
  { key: "baking-powder", aisle: "sweet", en: "Baking powder", fr: "Levure chimique", group: "baking" },
  { key: "yeast", aisle: "sweet", en: "Yeast", group: "baking" },
  { key: "vanilla-sugar", aisle: "sweet", fr: "Sucre vanillé", group: "baking" },
  { key: "dark-chocolate", aisle: "sweet", en: "Dark chocolate", fr: "Chocolat pâtissier", group: "baking" },
];

const isExtra = (entry: Entry, lang: Lang) =>
  Array.isArray(entry.extra) ? entry.extra.includes(lang) : entry.extra === true;

const toItems = (lang: Lang): FoodBankItem[] =>
  ENTRIES.filter((entry) => entry[lang]).map((entry) => ({
    key: entry.key,
    name: entry[lang]!,
    aisle: entry.aisle,
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
