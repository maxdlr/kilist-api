import findFoodSwipes from "@/api/foods/services/findFoodSwipes";
import createShopList from "@/api/shop-list/services/createShopList";
import createUser from "@/api/users/services/createUser";
import FoodRepository from "@/repositories/FoodRepository";
import ListRepository from "@/repositories/ListRepository";
import UserEntity from "@/entities/UserEntity";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import addFood from "../../controllers/addFood";

let user: UserEntity;
let listId: number;

const post = async (body: Record<string, unknown>) => {
  let created: { id: number } | undefined;
  const res = {
    status: () => res,
    json: (food: { id: number }) => {
      created = food;
      return res;
    },
  } as unknown as Response;

  await addFood({ body: { listId, ...body }, user } as unknown as Request, res);

  return FoodRepository.findOneByOrFail({ id: created!.id });
};

beforeEach(async () => {
  user = await createUser({
    username: "newcomer",
    email: "newcomer@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  const list = await ListRepository.findOneByOrFail({
    household: { id: user.household.id },
  });
  listId = list.id;
});

describe("addFood", () => {
  it("starts onboarding foods at 0.5", async () => {
    const food = await post({ name: "Milk", fromOnboarding: true });

    expect(food.inStockScore).toBe(0.5);
  });

  it("keeps the default score for other foods", async () => {
    const food = await post({ name: "Milk" });

    expect(food.inStockScore).toBe(1);
  });

  it("only accepts a literal true flag", async () => {
    const food = await post({ name: "Milk", fromOnboarding: "true" });

    expect(food.inStockScore).toBe(1);
  });

  it("makes onboarding foods reach the swipe and shop flows", async () => {
    const food = await post({ name: "Milk", fromOnboarding: true });

    const swipes = await findFoodSwipes(user.household.id, { take: 10 });
    expect(swipes.map(({ id }) => id)).toContain(food.id);

    const shopList = await createShopList(user.household.id);
    expect(shopList?.startFoods.map((f) => (f as { id: number }).id)).toContain(
      food.id,
    );
  });
});
