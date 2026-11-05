/**
 * A small, hardcoded catalogue of the most common household food items, used
 * to help new users populate their list during onboarding. Intentionally
 * static and minimal for now - a future feature may build this bank from
 * existing users' lists instead.
 */
export type FoodBankItem = {
  name: string;
  description?: string;
};

const FOOD_BANK: FoodBankItem[] = [
  { name: "Pasta" },
  { name: "Rice" },
  { name: "Bread" },
  { name: "Milk" },
  { name: "Eggs" },
  { name: "Butter" },
  { name: "Cheese" },
  { name: "Yogurt" },
  { name: "Chicken" },
  { name: "Ground beef" },
  { name: "Tomatoes" },
  { name: "Onions" },
  { name: "Potatoes" },
  { name: "Garlic" },
  { name: "Apples" },
  { name: "Bananas" },
  { name: "Coffee" },
  { name: "Olive oil" },
  { name: "Flour" },
  { name: "Sugar" },
];

export default FOOD_BANK;
