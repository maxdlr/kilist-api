import { FOOD_BANKS, foodKeyOf } from "@/api/food-bank/foodBank";
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
});
