import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import FoodRepository from "@/repositories/FoodRepository";
import { randomElement } from "@/utils/helpers";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, test } from "vitest";
import findAllFoods from "../services/findAllFoods";
import findFoodSwipes from "../services/findFoodSwipes";
import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";

let foods: FoodEntity[];

beforeEach(async () => {
  foods = await FoodRepository.save(
    Array.from({ length: 100 }).map((_, index) => ({
      name: `Food ${index + 1}`,
      description: `Description for Food ${index + 1}`,
    })),
  );

  await FoodHistoryRepository.save(
    Array.from({ length: 500 }).map((_, _index) => ({
      food: randomElement(foods),
      isInStock: faker.datatype.boolean(),
      createdAt: faker.date.past({ years: 1 }),
    })),
  );
});

test("browseFoods get 10 foods", async () => {
  const foods10 = await findAllFoods({
    take: 10,
  });

  expect(foods10).toHaveLength(10);
});

test("browseFoods gets 10 foods for swipes which have the oldest foodhistories", async () => {
  const testFoods = await findFoodSwipes({ take: 10 });

  const foodsWithHistory = testFoods.filter(
    (food) => food.foodHistories && food.foodHistories.length > 0,
  );

  for (let i = 0; i < foodsWithHistory.length - 1; i++) {
    const current = foodsWithHistory[i];
    const next = foodsWithHistory[i + 1];

    expect(
      current?.foodHistories?.[0]?.createdAt?.getTime(),
    ).toBeLessThanOrEqual(
      next?.foodHistories?.[0]?.createdAt?.getTime() ?? Infinity,
    );
  }
});

test("browseFoods gets 10 foods for swipes that most likely still inStock", async () => {
  const testFoods = await findFoodSwipes({ take: 10 });

  expect(testFoods?.[0]?.inStockScore).toBeGreaterThanOrEqual(0.5);
});

test("browseFoods gets 10 foods for swipes many times", async () => {
  for (let i = 0; i < 10; i++) {
    const testFoods = await findFoodSwipes({ take: 10 });

    expect(testFoods).toHaveLength(10);

    for (const food of testFoods) {
      await createFoodHistory({
        foodId: food?.id || 0,
        isInStock: faker.datatype.boolean(),
      });
    }
  }
});

test("browseFoods gets 10 foods for swipes, starting by prioritizing foods with no foodhistories, then foods with the oldest foodhistories", async () => {
  const foodsWithNoFoodHistoriesMap = new Map<number, number>();

  for (let i = 0; i < 10; i++) {
    const testFoods = await findFoodSwipes({ take: 10 });

    expect(testFoods?.[0]?.inStockScore).toBeGreaterThanOrEqual(0.5);
    expect(testFoods).toHaveLength(10);

    for (const food of testFoods) {
      await createFoodHistory({
        foodId: food?.id || 0,
        isInStock: faker.datatype.boolean(),
      });
    }

    const allFoods = await findAllFoods({ relations: { foodHistories: true } });

    const foodsWithNoFoodHistories = allFoods.filter(
      (food) => !food.foodHistories || food.foodHistories.length === 0,
    );

    foodsWithNoFoodHistoriesMap.set(i, foodsWithNoFoodHistories.length);
  }

  [...foodsWithNoFoodHistoriesMap].forEach(([key, value]) => {
    if (key > 0) {
      expect(value).toBeLessThanOrEqual(
        foodsWithNoFoodHistoriesMap.get(key - 1) ?? Infinity,
      );
    }
  });
});
