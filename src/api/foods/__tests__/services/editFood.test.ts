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
    description: "Granny Smith",
    household,
  });
});

describe("editFood", () => {
  it("updates name and description", async () => {
    const updated = await editFood(household.id, food.id, {
      name: "Pears",
      description: "Bartlett",
    });

    expect(updated.name).toBe("Pears");
    expect(updated.description).toBe("Bartlett");
  });

  it("updates only the provided fields", async () => {
    const updated = await editFood(household.id, food.id, {
      name: "Pears",
    });

    expect(updated.name).toBe("Pears");
    expect(updated.description).toBe("Granny Smith");
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
