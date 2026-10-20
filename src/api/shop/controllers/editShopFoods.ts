import resetFoodHistories from "@/api/foodHistories/services/resetFoodHistories";
import findFood from "@/api/foods/services/findFood";
import snoozeFood from "@/api/foods/services/snoozeFood";
import updateFrequencies from "@/api/frequencies/services/updateFrequencies";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { EntityManager, In } from "typeorm";
import findSession from "../services/findSession";
import updateSession from "../services/updateSession";
import getMostLikelyNextFoods from "@/api/frequencies/services/getMostLikelyNextFood";
import findAllFoods from "@/api/foods/services/findAllFoods";
import FoodEntity from "@/entities/FoodEntity";

export enum SessionFoodStatus {
  BUY = "buy",
  SNOOZE = "snooze",
}

const editShopFoods = async ({ body, query }: Request, res: Response) => {
  const { sessionId } = query;
  const { foodId, previousFoodId, action } = body;

  if (!Object.values(SessionFoodStatus).includes(action)) {
    throw ApiError(
      `Invalid action. Must be one of: ${Object.values(SessionFoodStatus).join(
        ", ",
      )}`,
    );
  }

  if (!sessionId) {
    throw ApiError("sessionId is required in query parameters");
  }

  if (!foodId) {
    throw ApiError("foodId are required in the request body");
  }

  return await doTransaction(async (m: EntityManager) => {
    const id = Number(foodId);

    const session = await findSession({ id: Number(sessionId) }, m);
    let food = await findFood({ id }, m);

    if (!food) {
      throw ApiError(`Food with id ${foodId} not found`);
    }

    if (!session) {
      throw ApiError(`Session with id ${sessionId} not found`);
    }

    if (action === SessionFoodStatus.SNOOZE) {
      food = await snoozeFood(food);
    }

    if (action === SessionFoodStatus.BUY) {
      const boughtFood = (session.boughtFoods as FoodEntity[]) || [];

      if (action === SessionFoodStatus.BUY) {
        if (!boughtFood.map((f) => f.id).includes(food.id)) {
          boughtFood.push(food);
        }
      }

      const updatedBoughtFoods = await findAllFoods({
        where: { id: In(boughtFood.map((f) => f.id)) },
      });

      await updateSession(
        { id: Number(sessionId), boughtFoods: updatedBoughtFoods },
        m,
      );
      await updateFrequencies({ previousFoodId, currentFoodId: id }, m);
      await resetFoodHistories(id, m);
    }

    const mostLikelyNextFoodIds = await getMostLikelyNextFoods(
      id,
      1,
      Number(sessionId),
      m,
    );

    return res.status(200).send(mostLikelyNextFoodIds);
  });
};

export default editShopFoods;
