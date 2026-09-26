import FoodEntity from "@/entities/FoodEntity";
import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import FoodRepository from "@/repositories/FoodRepository";
import ListRepository from "@/repositories/ListRepository";
import UserRepository from "@/repositories/UserRepository";
import { faker } from "@faker-js/faker";
import { assert, beforeEach, expect, test } from "vitest";
import findList from "../services/findList";

let foods: FoodEntity[] = [];
let user: UserEntity;
let fixtureList: ListEntity;

beforeEach(async () => {
  foods = await FoodRepository.save(
    Array.from({ length: 10 }, (_, i) => {
      return FoodRepository.create({
        name: `Food ${i + 1}`,
        inStockScore: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      });
    }),
  );
  user = new UserEntity();
  user.username = faker.internet.displayName();
  user.email = faker.internet.email();
  user.password = faker.internet.password();

  user = await UserRepository.save(user);

  fixtureList = await ListRepository.save({
    title: `List`,
    foods,
    user,
  });
});

test("browseList returns a list", async () => {
  const list = await findList({ id: fixtureList.id });
  expect(list.foods).toHaveLength(10);
});

test("browseList returns a list with sorted items", async () => {
  const list = await findList({ id: fixtureList.id });
  expect(list.foods).toHaveLength(10);

  assert(list.foods);
  for (let i = 0; i < list.foods.length - 1; i++) {
    const current = list.foods[i];
    const next = list.foods[i + 1];

    if (current && next) {
      expect(current.inStockScore).toBeLessThanOrEqual(next.inStockScore);
    }
  }
});
