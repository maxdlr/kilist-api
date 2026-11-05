import { describe, expect, it } from "vitest";
import findFoodIcon from "../findFoodIcon";
import FOOD_BANK from "../foodBank";

describe("findFoodIcon", () => {
  it("gives every food bank item an icon", () => {
    expect(FOOD_BANK.filter((item) => !item.icon)).toEqual([]);
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
