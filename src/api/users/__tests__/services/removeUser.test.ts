import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import FoodRepository from "@/repositories/FoodRepository";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import ListRepository from "@/repositories/ListRepository";
import RefreshTokenRepository from "@/repositories/RefreshTokenRepository";
import ShopListRepository from "@/repositories/ShopListRepository";
import UserRepository from "@/repositories/UserRepository";
import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import { ShopListStatus } from "@/entities/ShopListEntity";
import createFood from "@/api/foods/services/createFood";
import { describe, expect, it } from "vitest";
import createUser from "../../services/createUser";
import removeUser from "../../services/removeUser";

const makeOwner = (name: string) =>
  createUser({
    username: name,
    email: `${name}@example.com`,
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
    householdName: `${name} home`,
  });

const stockHousehold = async (householdId: number) => {
  const list = await ListRepository.findOneByOrFail({
    household: { id: householdId },
  });
  const food: FoodEntity = await createFood(householdId, list.id, {
    name: "Milk",
  });
  await FoodHistoryRepository.save({ food, isInStock: true });
  await FrequencyRepository.save({
    food,
    nextBoughtFood: food,
    household: { id: householdId },
  });
  await ShopListRepository.save({
    status: ShopListStatus.STARTED,
    startFoods: [food],
    boughtFoods: [food],
    household: { id: householdId },
  });
};

describe("removeUser", () => {
  it("deletes the user and their refresh tokens only", async () => {
    const user = await makeOwner("leaving");
    const other = await makeOwner("staying");
    await RefreshTokenRepository.save(
      [user, other].map(
        ({ id }) =>
          ({
            token: `token-${id}`,
            expireOn: new Date(Date.now() + 60_000),
            userId: id,
          }) as RefreshTokenEntity,
      ),
    );

    await removeUser({ id: user.id });

    expect(await UserRepository.findOneBy({ id: user.id })).toBeNull();
    expect(await UserRepository.findOneBy({ id: other.id })).not.toBeNull();
    expect(await RefreshTokenRepository.countBy({ userId: user.id })).toBe(0);
    expect(await RefreshTokenRepository.countBy({ userId: other.id })).toBe(1);
  });

  it("deletes the household and all its data with its last member", async () => {
    const user = await makeOwner("leaving");
    const other = await makeOwner("staying");
    await stockHousehold(user.household.id);
    await stockHousehold(other.household.id);

    await removeUser({ id: user.id });

    expect(
      await HouseholdRepository.findOneBy({ id: user.household.id }),
    ).toBeNull();
    expect(await ListRepository.count()).toBe(1);
    expect(await FoodRepository.count()).toBe(1);
    expect(await FoodHistoryRepository.count()).toBe(1);
    expect(await FrequencyRepository.count()).toBe(1);
    expect(await ShopListRepository.count()).toBe(1);
  });

  it("keeps a household that still has members", async () => {
    const owner = await makeOwner("owner");
    const joiner = await createUser({
      username: "joiner",
      email: "joiner@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "join",
      joinCode: owner.household.joinCode,
    });
    await stockHousehold(owner.household.id);

    await removeUser({ id: owner.id });

    expect(await UserRepository.findOneBy({ id: joiner.id })).not.toBeNull();
    expect(
      await HouseholdRepository.findOneBy({ id: owner.household.id }),
    ).not.toBeNull();
    expect(await FoodRepository.count()).toBe(1);
  });
});
