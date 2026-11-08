import findAllFrequencies from "@/api/frequencies/services/findAllFrequencies";
import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import FoodRepository from "@/repositories/FoodRepository";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import { randomElement } from "@/helpers/random";
import { beforeEach, describe, expect, test } from "vitest";
import updateFrequencies from "../../services/updateFrequencies";
import getMostLikelyNextFoods from "../../services/getMostLikelyNextFood";

let foods: FoodEntity[];
let household: HouseholdEntity;

beforeEach(async () => {
  household = await HouseholdRepository.save({ joinCode: generateJoinCode() });

  foods = await FoodRepository.save(
    Array.from({ length: 20 }, (_, i) => ({
      name: `Food ${i + 1}`,
      household,
    })),
  );

  await FrequencyRepository.save(
    Array.from({ length: 100 }, () => ({
      food: randomElement(foods),
      nextBoughtFood: randomElement(foods),
      household,
    })),
  );

  await FrequencyRepository.save(
    Array.from({ length: 100 }, () => ({
      food: foods?.[0] as FoodEntity,
      nextBoughtFood: randomElement(foods),
      household,
    })),
  );
  await FrequencyRepository.save(
    Array.from({ length: 100 }, () => ({
      food: foods?.[1] as FoodEntity,
      nextBoughtFood: randomElement(foods),
      household,
    })),
  );
});

test("keeps frequency to 100 maximum", async () => {
  const foodFrequency = await findAllFrequencies({
    where: { food: { id: foods?.[0]?.id } },
  });

  expect(foodFrequency.length).toBeGreaterThan(100);

  await updateFrequencies({
    previousFoodId: foods?.[0]?.id as number,
    currentFoodId: randomElement(foods)?.id as number,
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
        household,
      })),
    );
  }

  await FrequencyRepository.save(
    Array.from({ length: 100 }, () => ({
      food: foods?.[1] as FoodEntity,
      nextBoughtFood: foods?.[2] as FoodEntity,
      household,
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

describe("recording purchases", () => {
  const makeFoods = async () => {
    const home = await HouseholdRepository.save({
      joinCode: generateJoinCode(),
    });
    const [first, second] = await FoodRepository.save([
      { name: "First", household: home },
      { name: "Second", household: home },
    ]);
    return { first: first as FoodEntity, second: second as FoodEntity };
  };

  const countFor = async (foodId: number) =>
    (await findAllFrequencies({ where: { food: { id: foodId } } })).length;

  test("records the first frequency of a food with no history", async () => {
    const { first, second } = await makeFoods();

    await updateFrequencies({
      previousFoodId: first.id,
      currentFoodId: second.id,
    });

    const [frequency] = await findAllFrequencies({
      where: { food: { id: first.id } },
    });
    expect(await countFor(first.id)).toBe(1);
    expect(frequency?.nextBoughtFood).toBe(second.id);
  });

  test("records nothing without a previous food, leaving other households alone", async () => {
    const { second } = await makeFoods();
    const total = await FrequencyRepository.count();

    await updateFrequencies({ currentFoodId: second.id });

    expect(await FrequencyRepository.count()).toBe(total);
  });

  test("ignores a previous food from another household", async () => {
    const { second } = await makeFoods();
    const foreign = foods?.[0] as FoodEntity;
    const before = await countFor(foreign.id);

    await updateFrequencies({
      previousFoodId: foreign.id,
      currentFoodId: second.id,
    });

    expect(await countFor(foreign.id)).toBe(before);
  });
});
