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

const FOOD_BANK: FoodBankItem[] = [
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
].map((name) => ({ name, icon: findFoodIcon(name) }));

export default FOOD_BANK;
