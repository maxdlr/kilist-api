import resetFoodHistories from "@/api/foodHistories/services/resetFoodHistories";
import findFood from "@/api/foods/services/findFood";
import snoozeFood from "@/api/foods/services/snoozeFood";
import updateFrequencies from "@/api/frequencies/services/updateFrequencies";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { EntityManager, In } from "typeorm";
import getMostLikelyNextFoods from "@/api/frequencies/services/getMostLikelyNextFood";
import findAllFoods from "@/api/foods/services/findAllFoods";
import FoodEntity from "@/entities/FoodEntity";
import findShopList from "../services/findShopList";
import updateShopList from "../services/updateShopList";

export const SAME_TRIP_MS = 30 * 60 * 1000;

export enum EditShopAction {
  BUY = "buy",
  SNOOZE = "snooze",
}

const editShopList = async ({ body, params, user }: Request, res: Response) => {
  const { id: shopListId } = params;
  const { foodId, action } = body;
  const householdId = user!.household.id;

  if (!Object.values(EditShopAction).includes(action)) {
    throw ApiError(
      `Invalid action. Must be one of: ${Object.values(EditShopAction).join(
        ", ",
      )}`,
    );
  }

  if (!shopListId) {
    throw ApiError("shopListId is required in query parameters");
  }

  if (!foodId) {
    throw ApiError("foodId are required in the request body");
  }

  return await doTransaction(async (m: EntityManager) => {
    const id = Number(foodId);

    const shopList = await findShopList(
      { id: Number(shopListId), household: { id: householdId } },
      m,
    );
    let food = await findFood({ id, household: { id: householdId } }, m);

    if (!food) {
      throw ApiError(`Food with id ${foodId} not found`);
    }

    if (!shopList) {
      throw ApiError(`ShopList with id ${shopListId} not found`);
    }

    if (action === EditShopAction.SNOOZE) {
      food = await snoozeFood(food);
    }

    if (action === EditShopAction.BUY) {
      const boughtFood = (shopList.boughtFoods as FoodEntity[]) || [];

      if (action === EditShopAction.BUY) {
        if (!boughtFood.map((f) => f.id).includes(food.id)) {
          boughtFood.push(food);
        }
      }

      const updatedBoughtFoods = await findAllFoods({
        where: { id: In(boughtFood.map((f) => f.id)) },
      });

      const buyLog = shopList.buyLog ?? [];
      const now = new Date();
      const last = buyLog[buyLog.length - 1];
      const previousFoodId =
        last && now.getTime() - new Date(last.at).getTime() <= SAME_TRIP_MS
          ? last.foodId
          : undefined;
      if (!buyLog.some((entry) => entry.foodId === food.id)) {
        buyLog.push({ foodId: food.id, at: now.toISOString() });
      }

      const lastSuggestion = shopList.suggestionLog?.at(-1);
      if (lastSuggestion && !lastSuggestion.taken && lastSuggestion.foodId === food.id) {
        lastSuggestion.taken = true;
      }

      await updateShopList(
        {
          id: Number(shopListId),
          boughtFoods: updatedBoughtFoods,
          buyLog,
          suggestionLog: shopList.suggestionLog ?? null,
        },
        m,
      );
      await updateFrequencies({ previousFoodId, currentFoodId: id }, m);
      await resetFoodHistories(id, m);
    }

    const mostLikelyNextFoodIds = await getMostLikelyNextFoods(
      id,
      1,
      Number(shopListId),
      m,
    );

    const suggested = mostLikelyNextFoodIds?.[0];
    if (suggested) {
      await updateShopList(
        {
          id: Number(shopListId),
          suggestionLog: [...(shopList.suggestionLog ?? []), { foodId: suggested, taken: false }],
        },
        m,
      );
    }

    return res.status(200).send(mostLikelyNextFoodIds);
  });
};

export default editShopList;
