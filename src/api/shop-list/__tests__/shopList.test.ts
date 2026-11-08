import HouseholdEntity from "@/entities/HouseholdEntity";
import FoodRepository from "@/repositories/FoodRepository";
import ListRepository from "@/repositories/ListRepository";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, test } from "vitest";
import createShopList from "../services/createShopList";
import findShopList from "../services/findShopList";

let household: HouseholdEntity;

beforeEach(async () => {
  household = await HouseholdRepository.save({ joinCode: generateJoinCode() });

  const list = await ListRepository.save({ title: "Main list", household });

  await FoodRepository.save(
    Array.from({ length: 10 }, (_, i) => {
      return FoodRepository.create({
        name: `Food ${i + 1}`,
        inStockScore: faker.number.float({
          min: 0,
          max: 0.99,
          fractionDigits: 2,
        }),
        household,
        lists: [list],
      });
    }),
  );
});

test("browseShopFoods returns a list of foods", async () => {
  const shopList = (await createShopList(household.id))!;

  expect(shopList).toBeDefined();
  expect(shopList.startFoods).toHaveLength(10);
});

test("findShopList keeps startFoods intact after a shopList is created and re-fetched", async () => {
  const created = (await createShopList(household.id))!;

  const found = await findShopList({ id: created.id });

  expect(found?.startFoods).toHaveLength(10);
});
