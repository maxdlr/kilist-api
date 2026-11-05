import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import FoodRepository from "@/repositories/FoodRepository";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import generateJoinCode from "@/utils/generateJoinCode";
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
let household: HouseholdEntity;

beforeEach(async () => {
  household = await HouseholdRepository.save({ joinCode: generateJoinCode() });

  foods = await FoodRepository.save(
    Array.from({ length: 300 }).map((_, index) => ({
      name: `Food ${index + 1}`,
      description: `Description for Food ${index + 1}`,
      inStockScore: faker.number.float({
        min: 0,
        max: 0.74,
        fractionDigits: 2,
      }),
      household,
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
      household,
    })),
  );
});

test("browseFoods get 10 foods", async () => {
  const foods10 = await findAllFoods({
    take: 10,
  });

  expect(foods10).toHaveLength(10);
});

test("browseFoods only returns foods whose latest foodhistory is older than 24h (or has none)", async () => {
  const testFoods = await findFoodSwipes(household.id, { take: 10 });
  const cutoff = new Date(Date.now() - 24 * 3600000);

  for (const food of testFoods) {
    const foodHistories = food.foodHistories;
    if (!foodHistories || foodHistories.length === 0) continue;

    const latestCreatedAt = foodHistories.reduce(
      (latest, history) => Math.max(latest, history.createdAt?.getTime() ?? 0),
      0,
    );

    expect(latestCreatedAt).toBeLessThan(cutoff.getTime());
  }
});

test("browseFoods gets 10 foods for swipes ordered by highest inStockScore first", async () => {
  const testFoods = await findFoodSwipes(household.id, { take: 10 });

  for (let i = 0; i < testFoods.length - 1; i++) {
    expect(testFoods[i]!.inStockScore).toBeGreaterThanOrEqual(
      testFoods[i + 1]!.inStockScore,
    );
  }
});

test("browseFoods gets 10 foods for swipes many times", async () => {
  for (let i = 0; i < 10; i++) {
    const testFoods = await findFoodSwipes(household.id, { take: 10 });

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
    const testFoods = await findFoodSwipes(household.id, { take: 10 });

    // Verify the actual ordering guarantee (highest inStockScore first)
    // rather than an arbitrary threshold, which isn't guaranteed given the
    // randomly seeded scores.
    for (let j = 0; j < testFoods.length - 1; j++) {
      expect(testFoods[j]!.inStockScore).toBeGreaterThanOrEqual(
        testFoods[j + 1]!.inStockScore,
      );
    }
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
      household,
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
