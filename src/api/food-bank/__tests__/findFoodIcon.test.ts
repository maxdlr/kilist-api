import { describe, expect, it } from "vitest";
import findFoodIcon from "../findFoodIcon";
import { FOOD_BANKS } from "../foodBank";
import { FOOD_ICON_ALIASES } from "../foodIconAliases";

describe("findFoodIcon", () => {
  it.each(Object.entries(FOOD_ICON_ALIASES))("finds the %s icon from its first name", (icon, aliases) => {
    expect(findFoodIcon(aliases[0]!)).toBe(icon);
  });

  it.each(Object.entries(FOOD_BANKS))("gives every %s staple an icon", (_, bank) => {
    expect(bank.filter((item) => item.staple && !item.icon)).toEqual([]);
  });

  it.each([
    ["Beurre", "cheese"],
    ["Œufs", "eggs"],
    ["oeufs", "eggs"],
    ["Pommes de terre", "potatoes"],
    ["Compote de pommes", "apples"],
    ["Huile d'olive", "olive-oil"],
    ["Patate douce", "sweet-potato"],
    ["Beurre de cacahuète", "peanuts"],
    ["Fromage blanc", "yogurt"],
    ["Thon en boîte", "fish"],
    ["Pâtes", "pasta"],
    ["Poireaux", "leek"],
    ["Thé vert", "tea"],
  ])("matches the French %s to %s", (name, icon) => {
    expect(findFoodIcon(name)).toBe(icon);
  });

  it.each([
    ["Butter", "cheese"],
    ["Yogurt", "yogurt"],
    ["tomatoes", "tomatoes"],
    ["TOMATO", "tomatoes"],
    ["cherries", "cherry"],
    ["Greek yogurt", "yogurt"],
    ["cherry tomatoes", "tomatoes"],
    ["sweet potato", "sweet-potato"],
    ["peanut butter", "peanuts"],
    ["olive oil", "olive-oil"],
    ["olives", "olive"],
    ["ground beef", "ground-beef"],
    ["Yoghurt", "yogurt"],
    ["jalapeño chili", "chili"],
    ["orange juice", "citrus"],
    ["bannana", "bananas"],
    ["tomatoe", "tomatoes"],
    ["brocoli", "broccoli"],
    ["strawbery", "strawberry"],
  ])("matches %s to %s", (name, icon) => {
    expect(findFoodIcon(name)).toBe(icon);
  });

  it.each([
    "Toilet paper",
    "Kimchi",
    "Dish soap",
    "Tofu",
    "Batteries",
    "Bleach",
    "Sponge",
    "Shampoo",
    "",
    "   ",
  ])("finds no icon for %j", (name) => {
    expect(findFoodIcon(name)).toBeUndefined();
  });
});
