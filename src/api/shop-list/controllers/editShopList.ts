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

export enum EditShopAction {
  BUY = "buy",
  SNOOZE = "snooze",
}

const editShopList = async ({ body, params }: Request, res: Response) => {
  const { id: shopListId } = params;
  const { foodId, previousFoodId, action } = body;

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

    const shopList = await findShopList({ id: Number(shopListId) }, m);
    let food = await findFood({ id }, m);

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

      await updateShopList(
        { id: Number(shopListId), boughtFoods: updatedBoughtFoods },
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

    return res.status(200).send(mostLikelyNextFoodIds);
  });
};

export default editShopList;
