import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, test } from "vitest";
import createShopList from "../services/createShopList";
import findShopList from "../services/findShopList";

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
  const shopList = await createShopList();

  expect(shopList).toBeDefined();
  expect(shopList.startFoods).toHaveLength(10);
});

test("findShopList keeps startFoods intact after a shopList is created and re-fetched", async () => {
  const created = await createShopList();

  const found = await findShopList({ id: created.id });

  expect(found?.startFoods).toHaveLength(10);
});
