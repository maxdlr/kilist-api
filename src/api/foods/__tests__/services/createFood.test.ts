import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import ListRepository from "@/repositories/ListRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import { beforeEach, describe, expect, it } from "vitest";
import createFood from "../../services/createFood";

let household: HouseholdEntity;
let list: ListEntity;

beforeEach(async () => {
  household = await HouseholdRepository.save({ joinCode: generateJoinCode() });
  list = await ListRepository.save({ title: "Main list", household, foods: [] });
});

describe("createFood", () => {
  it("creates a food attached to the household and the given list", async () => {
    const food = await createFood(household.id, list.id, {
      name: "Apples",
      description: "Granny Smith",
    });

    expect(food.id).toBeDefined();
    expect(food.name).toBe("Apples");
    expect(food.description).toBe("Granny Smith");

    const updatedList = await ListRepository.findOne({
      where: { id: list.id },
      relations: ["foods"],
    });
    expect(updatedList?.foods.map((f) => f.id)).toContain(food.id);
  });

  it("rejects attaching to a list from another household", async () => {
    const otherHousehold = await HouseholdRepository.save({
      joinCode: generateJoinCode(),
    });

    await expect(
      createFood(otherHousehold.id, list.id, { name: "Apples" }),
    ).rejects.toThrow();
  });

  it("rejects an empty name", async () => {
    await expect(
      createFood(household.id, list.id, { name: "" }),
    ).rejects.toThrow();
  });
});
