import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import FoodRepository from "@/repositories/FoodRepository";
import { randomElement } from "@/utils/helpers";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, test } from "vitest";
import findAllFoods from "../services/findAllFoods";
import findFoodSwipes from "../services/findFoodSwipes";
import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import updateFrequencies from "@/api/frequencies/services/updateFrequencies";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import findAllFrequencies from "@/api/frequencies/services/findAllFrequencies";
import getMostLikelyNextFoods from "@/api/frequencies/services/getMostLikelyNextFood";
import resetFoodHistories from "@/api/foodHistories/services/resetFoodHistories";
import findAllFoodHistories from "@/api/foodHistories/services/findAllFoodHistories";

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

  await FrequencyRepository.save(
    Array.from({ length: 1000 }).map(() => ({
      food: randomElement(foods),
      nextCheckFood: randomElement(foods),
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

test("updatefrequencies", async () => {
  const previous = randomElement(foods);
  const current = randomElement(foods);

  await FrequencyRepository.save(
    Array.from({ length: 1000 }).map(() => ({
      food: previous,
      nextBoughtFood: current,
    })),
  );

  await updateFrequencies({
    previousFoodId: previous.id,
    currentFoodId: current.id,
  });

  await resetFoodHistories(current.id);

  const frequencyCount = await findAllFrequencies({
    where: { food: { id: previous.id } },
  });

  const foodHistories = await findAllFoodHistories({
    where: { food: { id: current.id } },
  });

  expect(frequencyCount.length).toBeLessThanOrEqual(100);
  expect(foodHistories.length).toBe(0);

  const updatedCurrent = await findAllFoods({ where: { id: current.id } });
  expect(updatedCurrent?.[0]?.inStockScore).toBe(1);

  // current was just bought and reset to fully in stock, so it should no
  // longer be suggested as a "next food to buy"
  const mostLikelyNextFoodIds = await getMostLikelyNextFoods(previous.id, 1);
  expect(mostLikelyNextFoodIds ?? []).not.toContain(current.id);
});
