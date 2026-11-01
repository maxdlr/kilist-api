import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import FoodRepository from "@/repositories/FoodRepository";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import ListRepository from "@/repositories/ListRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import { beforeEach, describe, expect, it } from "vitest";
import removeFoodsFromList from "../services/removeFoodsFromList";

let household: HouseholdEntity;
let foods: FoodEntity[];
let list: ListEntity;

beforeEach(async () => {
  household = await HouseholdRepository.save({ joinCode: generateJoinCode() });

  foods = await FoodRepository.save(
    Array.from({ length: 3 }, (_, i) => ({
      name: `Food ${i + 1}`,
      household,
    })),
  );

  list = await ListRepository.save({ title: "Main list", household, foods });
});

describe("removeFoodsFromList", () => {
  it("detaches the given foods from the list without deleting them", async () => {
    const [first, second] = foods;

    const updatedList = await removeFoodsFromList(household.id, list.id, [
      first!.id,
    ]);

    expect(updatedList.foods.map((f) => f.id)).not.toContain(first!.id);
    expect(updatedList.foods.map((f) => f.id)).toContain(second!.id);

    const stillExists = await FoodRepository.findOne({
      where: { id: first!.id },
    });
    expect(stillExists).not.toBeNull();
  });

  it("detaches multiple foods at once", async () => {
    const updatedList = await removeFoodsFromList(
      household.id,
      list.id,
      foods.map((f) => f.id),
    );

    expect(updatedList.foods).toHaveLength(0);
  });

  it("rejects removing from a list in another household", async () => {
    const otherHousehold = await HouseholdRepository.save({
      joinCode: generateJoinCode(),
    });

    await expect(
      removeFoodsFromList(otherHousehold.id, list.id, [foods[0]!.id]),
    ).rejects.toThrow();
  });
});
