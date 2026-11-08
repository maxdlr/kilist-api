import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import FoodRepository from "@/repositories/FoodRepository";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import ListRepository from "@/repositories/ListRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import { beforeEach, describe, expect, it } from "vitest";
import createFood from "@/api/foods/services/createFood";
import findFoodSwipes from "@/api/foods/services/findFoodSwipes";
import createShopList from "@/api/shop-list/services/createShopList";
import findShopList from "@/api/shop-list/services/findShopList";
import findShopListRemainingFoods from "@/api/shop-list/services/findShopListRemainingFoods";
import createUser from "@/api/users/services/createUser";
import findList from "../services/findList";
import removeFoodsFromList from "../services/removeFoodsFromList";

let household: HouseholdEntity;
let foods: FoodEntity[];
let list: ListEntity;

beforeEach(async () => {
  household = await HouseholdRepository.save({ joinCode: generateJoinCode() });

  foods = await FoodRepository.save(
    Array.from({ length: 3 }, (_, i) => ({
      name: `Food ${i + 1}`,
      household,
    })),
  );

  list = await ListRepository.save({ title: "Main list", household, foods });
});

describe("removeFoodsFromList", () => {
  it("detaches the given foods from the list without deleting them", async () => {
    const [first, second] = foods;

    const updatedList = await removeFoodsFromList(household.id, list.id, [
      first!.id,
    ]);

    expect(updatedList.foods.map((f) => f.id)).not.toContain(first!.id);
    expect(updatedList.foods.map((f) => f.id)).toContain(second!.id);

    const stillExists = await FoodRepository.findOne({
      where: { id: first!.id },
    });
    expect(stillExists).not.toBeNull();
  });

  it("detaches multiple foods at once", async () => {
    const updatedList = await removeFoodsFromList(
      household.id,
      list.id,
      foods.map((f) => f.id),
    );

    expect(updatedList.foods).toHaveLength(0);
  });

  it("rejects removing from a list in another household", async () => {
    const otherHousehold = await HouseholdRepository.save({
      joinCode: generateJoinCode(),
    });

    await expect(
      removeFoodsFromList(otherHousehold.id, list.id, [foods[0]!.id]),
    ).rejects.toThrow();
  });
});

describe("a food removed from the list", () => {
  const user = () =>
    createUser({
      username: "shopper",
      email: "shopper@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });

  const setUp = async () => {
    const shopper = await user();
    const main = await findList({ household: { id: shopper.household.id }, isMain: true });
    const tomatoes = await createFood(shopper.household.id, main.id, { name: "Tomatoes", inStockScore: 0.5 });
    const milk = await createFood(shopper.household.id, main.id, { name: "Milk", inStockScore: 0.5 });
    return { shopper, main, tomatoes, milk };
  };

  it("is left out of a new shop list", async () => {
    const { shopper, main, tomatoes, milk } = await setUp();
    await removeFoodsFromList(shopper.household.id, main.id, [tomatoes.id]);

    const shopList = await createShopList(shopper.household.id);
    const startFoods = shopList!.startFoods as FoodEntity[];

    expect(startFoods.map((food) => food.id)).toEqual([milk.id]);
  });

  it("disappears from a shop list that is already open", async () => {
    const { shopper, main, tomatoes, milk } = await setUp();
    const open = await createShopList(shopper.household.id);

    await removeFoodsFromList(shopper.household.id, main.id, [tomatoes.id]);

    const shopList = await findShopList({ id: open!.id });
    expect(findShopListRemainingFoods(shopList!).map((food) => food.id)).toEqual([milk.id]);
  });

  it("is left out of the swipe game", async () => {
    const { shopper, main, tomatoes, milk } = await setUp();
    await removeFoodsFromList(shopper.household.id, main.id, [tomatoes.id]);

    const swipes = await findFoodSwipes(shopper.household.id, { take: 10 });

    expect(swipes.map((food) => food.id)).toEqual([milk.id]);
  });
});
