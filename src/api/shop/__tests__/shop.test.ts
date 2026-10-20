import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, test } from "vitest";
import createSession from "../services/createSession";
import findSession from "../services/findSession";

let foods: FoodEntity[] = [];
beforeEach(async () => {
  foods = await FoodRepository.save(
    Array.from({ length: 10 }, (_, i) => {
      return FoodRepository.create({
        name: `Food ${i + 1}`,
        inStockScore: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      });
    }),
  );
});

test("browseShopFoods returns a list of foods", async () => {
  const session = await createSession();

  expect(session).toBeDefined();
  expect(session.startFoods).toHaveLength(10);
});

test("findSession keeps startFoods intact after a session is created and re-fetched", async () => {
  const created = await createSession();

  const found = await findSession({ id: created.id });

  expect(found?.startFoods).toHaveLength(10);
});
