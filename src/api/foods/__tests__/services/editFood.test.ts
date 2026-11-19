import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import FoodRepository from "@/repositories/FoodRepository";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import { beforeEach, describe, expect, it } from "vitest";
import editFood from "../../services/editFood";

let household: HouseholdEntity;
let food: FoodEntity;

beforeEach(async () => {
  household = await HouseholdRepository.save({ joinCode: generateJoinCode() });
  food = await FoodRepository.save({
    name: "Apples",
    note: "Granny Smith",
    household,
  });
});

describe("editFood", () => {
  it("updates name and note", async () => {
    const updated = await editFood(household.id, food.id, {
      name: "Pears",
      note: "  Bartlett  ",
    });

    expect(updated.name).toBe("Pears");
    expect(updated.note).toBe("Bartlett");
  });

  it("clears a note with null or blank text", async () => {
    expect((await editFood(household.id, food.id, { note: "   " })).note).toBeNull();
    await editFood(household.id, food.id, { note: "Ripe" });
    expect((await editFood(household.id, food.id, { note: null })).note).toBeNull();
  });

  it("sets and clears the quantity, and rescores the food", async () => {
    const set = await editFood(household.id, food.id, { quantity: " 2 kg " });
    expect(set.quantity).toBe("2 kg");
    expect(typeof set.inStockScore).toBe("number");

    const cleared = await editFood(household.id, food.id, { quantity: null });
    expect(cleared.quantity).toBeNull();
  });

  it("updates only the provided fields", async () => {
    const updated = await editFood(household.id, food.id, {
      name: "Pears",
    });

    expect(updated.name).toBe("Pears");
    expect(updated.note).toBe("Granny Smith");
  });

  it("sets a known aisle and ignores an unknown one", async () => {
    const set = await editFood(household.id, food.id, { aisle: "produce" });
    expect(set.aisle).toBe("produce");

    const kept = await editFood(household.id, food.id, { aisle: "moon" });
    expect(kept.aisle).toBe("produce");
  });

  it("rejects editing a food from another household", async () => {
    const otherHousehold = await HouseholdRepository.save({
      joinCode: generateJoinCode(),
    });

    await expect(
      editFood(otherHousehold.id, food.id, { name: "Pears" }),
    ).rejects.toThrow();
  });

  it("rejects an empty name", async () => {
    await expect(
      editFood(household.id, food.id, { name: "" }),
    ).rejects.toThrow();
  });
});
