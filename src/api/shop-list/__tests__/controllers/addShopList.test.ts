import createUser from "@/api/users/services/createUser";
import FoodEntity from "@/entities/FoodEntity";
import { ShopListStatus } from "@/entities/ShopListEntity";
import UserEntity from "@/entities/UserEntity";
import FoodRepository from "@/repositories/FoodRepository";
import ListRepository from "@/repositories/ListRepository";
import ShopListRepository from "@/repositories/ShopListRepository";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import addShopList from "../../controllers/addShopList";

let user: UserEntity;

const start = async (): Promise<number | null> => {
  let id: number | null = null;
  const res = {
    status: () => res,
    json: (value: number | null) => {
      id = value;
      return res;
    },
  } as unknown as Response;

  await addShopList({ user } as unknown as Request, res);

  return id;
};

const addFood = async (): Promise<FoodEntity> =>
  FoodRepository.save({
    name: "Milk",
    inStockScore: 0.5,
    household: user.household,
    lists: [await ListRepository.findOneByOrFail({ household: { id: user.household.id }, isMain: true })],
  });

beforeEach(async () => {
  user = await createUser({
    username: "shopper",
    email: "shopper@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
});

describe("addShopList", () => {
  it("creates nothing when no food is eligible", async () => {
    expect(await start()).toBeNull();
    expect(await ShopListRepository.count()).toBe(0);
  });

  it("starts a list once foods become eligible", async () => {
    await start();
    await addFood();

    const id = await start();

    expect(id).not.toBeNull();
    const list = await ShopListRepository.findOne({
      where: { id: id! },
      relations: ["startFoods"],
    });
    expect(list?.startFoods).toHaveLength(1);
  });

  it("reuses an open list that has foods", async () => {
    await addFood();

    const first = await start();

    expect(await start()).toBe(first);
    expect(await ShopListRepository.count()).toBe(1);
  });

  it("closes an old empty list and replaces it", async () => {
    const empty = await ShopListRepository.save({
      status: ShopListStatus.STARTED,
      startFoods: [],
      boughtFoods: [],
      household: user.household,
    });
    await addFood();

    const id = await start();

    expect(id).not.toBe(empty.id);
    const closed = await ShopListRepository.findOneBy({ id: empty.id });
    expect(closed?.endedAt).toBeTruthy();
  });
});
