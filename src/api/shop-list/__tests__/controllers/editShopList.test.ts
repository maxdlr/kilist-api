import findAllFrequencies from "@/api/frequencies/services/findAllFrequencies";
import createUser from "@/api/users/services/createUser";
import FoodEntity from "@/entities/FoodEntity";
import UserEntity from "@/entities/UserEntity";
import FoodRepository from "@/repositories/FoodRepository";
import ShopListRepository from "@/repositories/ShopListRepository";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import editShopList from "../../controllers/editShopList";
import { SAME_TRIP_MS } from "../../helpers";
import createShopList from "../../services/createShopList";

let user: UserEntity;
let butter: FoodEntity;
let cheese: FoodEntity;
let milk: FoodEntity;

const act = async (shopListId: number, food: FoodEntity, action: "buy" | "snooze" = "buy") => {
  let body: number[] | null = null;
  const res = {
    status: () => res,
    send: (value: number[] | null) => {
      body = value;
      return res;
    },
  } as unknown as Response;
  await editShopList(
    { user, params: { id: String(shopListId) }, body: { foodId: food.id, action } } as unknown as Request,
    res,
  );
  return body as number[] | null;
};

const trip = async () => (await createShopList(user.household.id, undefined, user.id))!.id;

const restock = () =>
  FoodRepository.update({ household: { id: user.household.id } }, { inStockScore: 0 });

const nextAfter = async (food: FoodEntity) =>
  (await findAllFrequencies({ where: { food: { id: food.id } } })).map((f) => f.nextBoughtFood);

beforeEach(async () => {
  user = await createUser({
    username: "habits",
    email: "habits@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  [butter, cheese, milk] = (await FoodRepository.save(
    ["Butter", "Cheese", "Milk"].map((name) => ({ name, inStockScore: 0, household: user.household })),
  )) as [FoodEntity, FoodEntity, FoodEntity];
});

describe("learning the order of the store", () => {
  it("suggests the food usually bought right after this one", async () => {
    const first = await trip();
    await act(first, butter);
    await act(first, cheese);
    await act(first, milk);

    await restock();
    const second = await trip();

    expect(await act(second, butter)).toEqual([cheese.id]);
  });

  it("never links the last buy of one trip to the first buy of the next", async () => {
    const first = await trip();
    await act(first, butter);
    await act(first, cheese);

    await restock();
    const second = await trip();
    await act(second, milk);

    expect(await nextAfter(cheese)).toEqual([]);
    expect(await nextAfter(butter)).toEqual([cheese.id]);
  });

  it("doesn't link two buys far apart in time", async () => {
    const id = await trip();
    await act(id, butter);
    const list = (await ShopListRepository.findOneByOrFail({ id }))!;
    const old = new Date(Date.now() - SAME_TRIP_MS - 1000).toISOString();
    await ShopListRepository.save({ ...list, buyLog: [{ foodId: butter.id, at: old }] });

    await act(id, cheese);

    expect(await nextAfter(butter)).toEqual([]);
  });

  it("only suggests foods still waiting on this list", async () => {
    const first = await trip();
    await act(first, butter);
    await act(first, cheese);

    await restock();
    const second = await trip();
    await act(second, cheese);

    expect(await act(second, butter)).toEqual([]);
  });

  it("records whether the suggested food was bought next", async () => {
    const first = await trip();
    await act(first, butter);
    await act(first, cheese);

    await restock();
    const second = await trip();
    await act(second, butter);
    await act(second, cheese);
    await act(second, butter);

    const list = await ShopListRepository.findOneByOrFail({ id: second });
    expect(list.suggestionLog?.[0]).toEqual({ foodId: cheese.id, taken: true });
  });

  it("learns nothing from a snooze", async () => {
    const id = await trip();
    await act(id, butter, "snooze");
    await act(id, cheese);

    expect(await nextAfter(butter)).toEqual([]);
  });
});
