import resetFoodHistories from "@/api/foodHistories/services/resetFoodHistories";
import findAllFoods from "@/api/foods/services/findAllFoods";
import findFood from "@/api/foods/services/findFood";
import snoozeFood from "@/api/foods/services/snoozeFood";
import getMostLikelyNextFoods from "@/api/frequencies/services/getMostLikelyNextFood";
import updateFrequencies from "@/api/frequencies/services/updateFrequencies";
import FoodEntity from "@/entities/FoodEntity";
import { EntityManager, In } from "typeorm";
import { SAME_TRIP_MS } from "../helpers";
import findShopList from "./findShopList";
import updateShopList from "./updateShopList";

export type ShopAction = "buy" | "snooze";

const applyShopAction = async (
  {
    householdId,
    shopListId,
    foodId,
    action,
    at = new Date(),
  }: {
    householdId: number;
    shopListId: number;
    foodId: number;
    action: ShopAction;
    at?: Date;
  },
  m: EntityManager,
): Promise<number[] | null> => {
  const shopList = await findShopList(
    { id: shopListId, household: { id: householdId } },
    m,
  );
  let food = await findFood({ id: foodId, household: { id: householdId } }, m);

  if (!food) {
    throw ApiError(`Food with id ${foodId} not found`);
  }

  if (!shopList) {
    throw ApiError(`ShopList with id ${shopListId} not found`);
  }

  if (action === "snooze") {
    food = await snoozeFood(food, m, undefined, at);
  }

  if (action === "buy") {
    const boughtFood = (shopList.boughtFoods as FoodEntity[]) || [];
    const startFoods = (shopList.startFoods as FoodEntity[]) || [];

    if (!boughtFood.map((f) => f.id).includes(food.id)) {
      boughtFood.push(food);
    }

    const updatedBoughtFoods = await findAllFoods(
      { where: { id: In(boughtFood.map((f) => f.id)) } },
      m,
    );

    const buyLog = shopList.buyLog ?? [];
    const last = buyLog[buyLog.length - 1];
    const previousFoodId =
      last && at.getTime() - new Date(last.at).getTime() <= SAME_TRIP_MS
        ? last.foodId
        : undefined;
    if (!buyLog.some((entry) => entry.foodId === food!.id)) {
      buyLog.push({ foodId: food.id, at: at.toISOString() });
    }

    const lastSuggestion = shopList.suggestionLog?.at(-1);
    if (lastSuggestion && !lastSuggestion.taken && lastSuggestion.foodId === food.id) {
      lastSuggestion.taken = true;
    }

    await updateShopList(
      {
        id: shopListId,
        boughtFoods: updatedBoughtFoods,
        ...(!startFoods.some((f) => f.id === food!.id) && {
          startFoods: [...startFoods, food],
        }),
        buyLog,
        suggestionLog: shopList.suggestionLog ?? null,
      },
      m,
    );
    await updateFrequencies({ previousFoodId, currentFoodId: foodId }, m);
    await resetFoodHistories(foodId, m, at);
    if (!food.lastBoughtAt || at > food.lastBoughtAt) {
      await m.update(FoodEntity, foodId, { lastBoughtAt: at });
    }
  }

  const mostLikelyNextFoodIds = await getMostLikelyNextFoods(foodId, 1, shopListId, m);

  const suggested = mostLikelyNextFoodIds?.[0];
  if (suggested) {
    await updateShopList(
      {
        id: shopListId,
        suggestionLog: [...(shopList.suggestionLog ?? []), { foodId: suggested, taken: false }],
      },
      m,
    );
  }

  return mostLikelyNextFoodIds;
};

export default applyShopAction;
