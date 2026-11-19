import { AISLES } from "@/api/food-bank/aisles";
import { describe, expect, it } from "vitest";
import { RULES } from "../rules";

describe("aisle groups", () => {
  const grouped = RULES.aisleGroups.families.flatMap((family) => family.aisles);

  it("only names aisles that exist", () => {
    const known: string[] = AISLES.map((aisle) => aisle.id);
    expect(grouped.filter((id) => !known.includes(id))).toEqual([]);
  });

  it("puts each aisle in one family at most", () => {
    expect(new Set(grouped).size).toBe(grouped.length);
  });
});
