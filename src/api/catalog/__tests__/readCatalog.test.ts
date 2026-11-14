import { AISLES } from "@/api/food-bank/aisles";
import { FOOD_BANKS, foodKeyOf } from "@/api/food-bank/foodBank";
import { aisleOfTags, FOOD_NAMES } from "@/api/food-bank/foodNames";
import { PRIZES } from "@/api/prizes/catalog";
import { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import readCatalog from "../controllers/readCatalog";

describe("catalog", () => {
  it("serves both food banks with icons and the prize list", () => {
    let body: any;
    const res = { status: () => res, json: (value: unknown) => ((body = value), res) } as unknown as Response;

    readCatalog({} as Request, res);

    expect(Object.keys(body.foodBanks).sort()).toEqual(["en", "fr"]);
    expect(body.foodBanks.fr.find((item: any) => item.name === "Lait").icon).toBe("milk");
    expect(body.prizes).toEqual(PRIZES);
    expect(body.aisles).toEqual(AISLES);
    expect(body.foodNames.fr.drinks.length).toBeGreaterThan(0);
    expect(body.rules.suggestions.everyDays).toBeGreaterThan(0);
  });

  it("gives a food the same key in every language, and each name to one food only", () => {
    const { en, fr } = FOOD_BANKS;
    expect(fr.find((item) => item.name === "Pâtes")!.key).toBe(en.find((item) => item.name === "Pasta")!.key);
    expect(foodKeyOf(" pâtes ")).toBe(foodKeyOf("Pasta"));
    expect(foodKeyOf("Quinoa")).toBe("quinoa");

    const keys = new Map<string, string>();
    for (const item of [...en, ...fr]) {
      const name = item.name.trim().toLowerCase();
      expect(keys.get(name) ?? item.key).toBe(item.key);
      keys.set(name, item.key);
    }
    expect(en.find((item) => item.key === "lettuce")!.months).not.toContain(11);
  });

  it("files every bank food and suggested name under a known aisle", () => {
    const ids = new Set<string>(AISLES.map((aisle) => aisle.id));
    for (const item of [...FOOD_BANKS.en, ...FOOD_BANKS.fr]) expect(ids.has(item.aisle)).toBe(true);
    for (const names of Object.values(FOOD_NAMES)) {
      for (const aisle of Object.keys(names)) expect(ids.has(aisle)).toBe(true);
    }

    expect(FOOD_NAMES.fr.dairy).toContain("Yaourts à boire");
    expect(FOOD_NAMES.en.produce).toContain("Avocados");
    expect(FOOD_NAMES.fr.dairy).not.toContain("Yaourts");
    expect(aisleOfTags(["en:dairies", "en:yogurts"])).toBe("dairy");
    expect(aisleOfTags(["en:unknown-thing"])).toBeNull();
  });
});
