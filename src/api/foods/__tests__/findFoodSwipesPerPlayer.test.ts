import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import createUser from "@/api/users/services/createUser";
import FoodEntity from "@/entities/FoodEntity";
import UserEntity from "@/entities/UserEntity";
import FoodRepository from "@/repositories/FoodRepository";
import ListRepository from "@/repositories/ListRepository";
import { beforeEach, describe, expect, it } from "vitest";
import findFoodSwipes from "../services/findFoodSwipes";

let me: UserEntity;
let partner: UserEntity;
let foods: FoodEntity[];

beforeEach(async () => {
  me = await createUser({
    username: "player",
    email: "me@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  partner = await createUser({
    username: "partner",
    email: "partner@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "join",
    joinCode: me.household.joinCode,
  });
  const list = await ListRepository.save({ title: "Main list", household: me.household });
  foods = await FoodRepository.save(
    [1, 2, 3].map((index) => ({
      name: `Food ${index}`,
      inStockScore: 0.5,
      household: me.household,
      lists: [list],
    })),
  );
  // I just answered every card
  for (const food of foods) await createFoodHistory({ foodId: food.id, isInStock: true, userId: me.id });
});

const ids = (rows: FoodEntity[]) => rows.map((food) => food.id).sort();

describe("daily game deck", () => {
  it("rests the cards a player just answered, for that player only", async () => {
    expect(await findFoodSwipes(me.household.id, { take: 10, playerId: me.id })).toEqual([]);
    expect(ids(await findFoodSwipes(partner.household.id, { take: 10, playerId: partner.id }))).toEqual(ids(foods));
  });

  it("still rests them for the whole household outside the daily game", async () => {
    expect(await findFoodSwipes(me.household.id, { take: 10 })).toEqual([]);
  });
});
