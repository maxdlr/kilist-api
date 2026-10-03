import findAllFrequencies from "@/api/frequencies/services/findAllFrequencies";
import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import { randomElement } from "@/utils/helpers";
import { beforeEach, expect, test } from "vitest";
import updateFrequencies from "../../services/updateFrequencies";
import getMostLikelyNextFoods from "../../services/getMostLikelyNextFood";

let foods: FoodEntity[];

beforeEach(async () => {
  foods = await FoodRepository.save(
    Array.from({ length: 20 }, (_, i) => ({
      name: `Food ${i + 1}`,
    })),
  );

  await FrequencyRepository.save(
    Array.from({ length: 100 }, () => ({
      food: randomElement(foods),
      nextBoughtFood: randomElement(foods),
    })),
  );

  await FrequencyRepository.save(
    Array.from({ length: 100 }, () => ({
      food: foods?.[0] as FoodEntity,
      nextBoughtFood: randomElement(foods),
    })),
  );
  await FrequencyRepository.save(
    Array.from({ length: 100 }, () => ({
      food: foods?.[1] as FoodEntity,
      nextBoughtFood: randomElement(foods),
    })),
  );
});

test("keeps frequency to 100 maximum", async () => {
  const foodFrequency = await findAllFrequencies({
    where: { food: { id: foods?.[0]?.id } },
  });

  expect(foodFrequency.length).toBeGreaterThan(100);

  await updateFrequencies({
    previous: foods?.[0]?.id as number,
    current: randomElement(foods)?.id,
  });

  const updatedFoodFrequency = await findAllFrequencies({
    where: { food: { id: foods?.[0]?.id } },
  });

  expect(updatedFoodFrequency.length).toBe(100);
});

test("get most likely next food", async () => {
  // only foods with inStockScore < 1 are eligible to be suggested as "next food"
  const eligibleNextFoods = foods.slice(2, 8);
  await FoodRepository.save(
    eligibleNextFoods.map((food) => ({ ...food, inStockScore: 0.2 })),
  );

  // deterministically give foods[1] a frequency relationship with each
  // eligible food, so requesting 5 suggestions doesn't depend on the
  // random frequencies seeded in beforeEach covering all of them
  for (const nextFood of eligibleNextFoods) {
    await FrequencyRepository.save(
      Array.from({ length: 100 }, () => ({
        food: foods?.[1] as FoodEntity,
        nextBoughtFood: nextFood,
      })),
    );
  }

  await FrequencyRepository.save(
    Array.from({ length: 100 }, () => ({
      food: foods?.[1] as FoodEntity,
      nextBoughtFood: foods?.[2] as FoodEntity,
    })),
  );

  const foodFrequency = await findAllFrequencies({
    where: { food: { id: foods?.[1]?.id } },
  });
  expect(foodFrequency.length).toBeGreaterThan(100);

  const mostFiveLikelyNextFoodIds = await getMostLikelyNextFoods(
    foods?.[1]?.id as number,
    5,
  );

  expect(mostFiveLikelyNextFoodIds?.length).toBe(5);

  const most1LikelyNextFoodIds = await getMostLikelyNextFoods(
    foods?.[1]?.id as number,
  );

  expect(most1LikelyNextFoodIds?.length).toBe(1);
  expect(most1LikelyNextFoodIds?.[0]).toBe(foods?.[2]?.id);

  const mostLikely1In5NextFoodIds = await getMostLikelyNextFoods(
    foods?.[1]?.id as number,
    5,
  );

  expect(mostLikely1In5NextFoodIds?.length).toBe(5);
  expect(mostLikely1In5NextFoodIds?.[0]).toBe(foods?.[2]?.id);
});
