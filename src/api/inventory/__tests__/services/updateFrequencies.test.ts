import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import { randomElement } from "@/utils/helpers";
import { beforeAll, test } from "vitest";

let foods: FoodEntity[];

beforeAll(async () => {
  FrequencyRepository.deleteAll();
  FoodRepository.deleteAll();

  foods = await FoodRepository.save(
    Array.from({ length: 20 }, (_, i) => ({
      name: `Food ${i + 1}`,
    })),
  );

  await FrequencyRepository.save(
    Array.from({ length: 100 }, () => ({
      food: randomElement(foods),
      nextCheckFood: randomElement(foods),
    })),
  );
});

test("keeps frequency to 100 maximum", async () => {});

test("returns the next probable food item", async () => {});
