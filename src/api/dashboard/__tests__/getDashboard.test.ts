import recordSwipeSession from "@/api/swipe-list/services/recordSwipeSession";
import createUser from "@/api/users/services/createUser";
import FoodEntity from "@/entities/FoodEntity";
import { ShopListStatus } from "@/entities/ShopListEntity";
import UserEntity from "@/entities/UserEntity";
import FoodRepository from "@/repositories/FoodRepository";
import ShopListRepository from "@/repositories/ShopListRepository";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import getDashboard from "../controllers/getDashboard";

let user: UserEntity;

const read = async () => {
  let body: any;
  const res = {
    status: () => res,
    send: (value: unknown) => {
      body = value;
      return res;
    },
  } as unknown as Response;

  await getDashboard({ user } as unknown as Request, res);

  return body;
};

const addFood = (inStockScore: number) =>
  FoodRepository.save({
    name: "Food",
    inStockScore,
    household: user.household,
  } as FoodEntity);

const saveShopList = (bought: FoodEntity[], endedAt?: Date) =>
  ShopListRepository.save({
    status: ShopListStatus.COMPLETED,
    startFoods: bought,
    boughtFoods: bought,
    household: user.household,
    ...(endedAt && { endedAt }),
  });

beforeEach(async () => {
  user = await createUser({
    username: "owner",
    email: "owner@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
});

describe("getDashboard", () => {
  it("summarises foods by level with a total", async () => {
    await addFood(0);
    await addFood(0);
    await addFood(0.5);
    await addFood(1);

    const { foods } = await read();

    expect(foods.total).toBe(4);
    expect(foods.scoreSummary).toEqual({
      0: 2,
      0.25: 0,
      0.5: 1,
      0.75: 0,
      1: 1,
    });
  });

  it("counts only ended shopping sessions that bought something", async () => {
    const food = await addFood(1);
    await saveShopList([food], new Date());
    await saveShopList([], new Date());
    await saveShopList([food]);

    const { shopLists } = await read();

    expect(shopLists.total).toBe(1);
  });

  it("counts recorded swipe sessions for this household only", async () => {
    const other = await createUser({
      username: "other",
      email: "other@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });
    await recordSwipeSession(user.household.id);
    await recordSwipeSession(user.household.id);
    await recordSwipeSession(other.household.id);

    const { swipes } = await read();

    expect(swipes.total).toBe(2);
  });

  it("returns zeros for a new household", async () => {
    const { foods, shopLists, swipes } = await read();

    expect(foods.total).toBe(0);
    expect(shopLists.total).toBe(0);
    expect(swipes.total).toBe(0);
  });
});
