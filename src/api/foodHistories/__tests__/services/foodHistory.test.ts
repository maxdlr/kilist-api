import findAllFoods from "@/api/foods/services/findAllFoods";
import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it } from "vitest";
import { FoodHistoryCreateType } from "../../interfaces";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import createFoodHistory from "../../services/createFoodHistory";

describe("createFoodHistory", () => {
  let foods: FoodEntity[];
  beforeEach(async () => {
    foods = Array.from({ length: 10 }, (_, i) => {
      return FoodRepository.create({
        name: `Food ${i + 1}`,
        inStockScore: 1,
      } as Partial<FoodEntity>);
    });

    const savedFoods = await FoodRepository.save(foods);

    const inStockScores = Array.from({ length: 10 }, (_, i) => {
      return FoodHistoryRepository.create({
        food: { id: savedFoods[i]?.id } as Partial<FoodEntity>,
        isInStock: true,
      } as Partial<FoodHistoryEntity>);
    });

    await FoodHistoryRepository.save(inStockScores);
  });

  it("create food history", async () => {
    const update: FoodHistoryCreateType[] = Array.from(
      { length: 10 },
      (_, i) => {
        return {
          foodId: foods[i]?.id,
          isInStock: i % 2 === 0,
        } as FoodHistoryCreateType;
      },
    );
    await createFoodHistory(update);
    const updatedFoods = await FoodRepository.find({ order: { id: "ASC" } });

    for (let i = 0; i < updatedFoods.length; i++) {
      const update = updatedFoods[i];
      if (i % 2 === 0) {
        expect(update?.inStockScore).toBe(1);
      } else {
        expect(update?.inStockScore).toBe(Number((0.5).toFixed(2)));
      }
    }

    expect(updatedFoods.length).toBe(10);
  });
});

describe("createFoodHistory sorts the food by inStockScores for lists", async () => {
  let orderedFoods: FoodEntity[];
  let foods: FoodEntity[];

  beforeEach(async () => {
    foods = Array.from({ length: 10 }, (_, i) => {
      return FoodRepository.create({
        name: `Food ${i + 1}`,
        inStockScore: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      } as Partial<FoodEntity>);
    });

    await FoodRepository.save(foods);
    orderedFoods = await findAllFoods();
  });

  it("should return the list order by inStockScores", async () => {
    for (let i = 0; i < orderedFoods.length - 1; i++) {
      const current = orderedFoods[i];
      const next = orderedFoods[i + 1];
      if (current && next) {
        expect(current.inStockScore).toBeGreaterThanOrEqual(next.inStockScore);
      }
    }
  });

  it("should sort the food by inStockScores", async () => {
    const updates: FoodHistoryCreateType[] = Array.from(
      { length: 10 },
      (_, i) => {
        return {
          foodId: foods[i]?.id,
          isInStock: faker.datatype.boolean(),
        } as FoodHistoryCreateType;
      },
    );

    await createFoodHistory(updates);

    for (let i = 0; i < orderedFoods.length - 1; i++) {
      const current = orderedFoods[i];
      const next = orderedFoods[i + 1];
      if (current && next) {
        expect(current.inStockScore).toBeGreaterThanOrEqual(next.inStockScore);
      }
    }
  });
});
