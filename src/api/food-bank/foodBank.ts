import { Lang } from "@/i18n";
import findFoodIcon from "./findFoodIcon";

/**
 * A small, hardcoded catalogue of the most common household food items, used
 * to help new users populate their list during onboarding. Intentionally
 * static and minimal for now - a future feature may build this bank from
 * existing users' lists instead.
 */
export type FoodBankItem = {
  name: string;
  description?: string;
  icon?: string;
};

const ENGLISH_FOODS = [
  "Pasta",
  "Rice",
  "Bread",
  "Milk",
  "Eggs",
  "Butter",
  "Cheese",
  "Yogurt",
  "Chicken",
  "Ground beef",
  "Tomatoes",
  "Onions",
  "Potatoes",
  "Garlic",
  "Apples",
  "Bananas",
  "Coffee",
  "Olive oil",
  "Flour",
  "Sugar",
];

const FRENCH_FOODS = [
  "Pâtes",
  "Riz",
  "Baguette",
  "Pain de mie",
  "Lait",
  "Œufs",
  "Beurre",
  "Emmental râpé",
  "Yaourts",
  "Crème fraîche",
  "Poulet",
  "Jambon",
  "Lardons",
  "Tomates",
  "Oignons",
  "Pommes de terre",
  "Ail",
  "Carottes",
  "Salade",
  "Pommes",
  "Bananes",
  "Café",
  "Huile d'olive",
  "Farine",
  "Sucre",
  "Moutarde",
  "Thon en boîte",
];

const toItems = (names: string[]): FoodBankItem[] =>
  names.map((name) => ({ name, icon: findFoodIcon(name) }));

export const FOOD_BANKS: Record<Lang, FoodBankItem[]> = {
  en: toItems(ENGLISH_FOODS),
  fr: toItems(FRENCH_FOODS),
};

const FOOD_BANK = FOOD_BANKS.en;

export default FOOD_BANK;
