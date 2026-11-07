import { describe, expect, it } from "vitest";
import { rankByName } from "../foodSearch";

const foods = ["Milk", "MILK", "milk ", "Oat milk", "Pineapple", "Pine apple", "Apple", "Pâtes", "Lait", "Ananas", "Pineaple"].map((name, index) => ({
  id: index + 1,
  name,
}));
const names = (search: string) => rankByName(foods, search).map((food) => food.name);

describe("admin food search", () => {
  it("ignores case and spaces", () => {
    expect(names("milk").slice(0, 3).sort()).toEqual(["MILK", "Milk", "milk "]);
    expect(names("milk")).toContain("Oat milk");
  });

  it("finds pineapple however it is written, without apples", () => {
    for (const search of ["pineapple", "pine apple", "pine with apple", "PINE-APPLE"]) {
      expect(names(search)).toEqual(expect.arrayContaining(["Pineapple", "Pine apple", "Pineaple"]));
      expect(names(search)).not.toContain("Apple");
    }
  });

  it("ignores accents", () => {
    expect(names("pates")).toEqual(["Pâtes"]);
  });

  it("returns everything without a search", () => {
    expect(rankByName(foods, "  ")).toHaveLength(foods.length);
  });
});
