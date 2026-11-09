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
  });
});
