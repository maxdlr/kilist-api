import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import findFood from "@/api/foods/services/findFood";
import { awardSwipe } from "@/api/prizes/services/tickets";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { EntityManager } from "typeorm";

const NO_REWARD = { earned: 0, bonus: 0, balance: null };

const editFoods = async ({ body, params, user }: Request, res: Response) => {
  const foodId = Number(params.id);
  const isInStock = body?.isInStock;

  if (!Number.isInteger(foodId)) {
    throw ApiError("A food id is required");
  }
  if (isInStock !== true && isInStock !== false && isInStock !== null) {
    throw ApiError("isInStock must be true, false or null");
  }

  await doTransaction(async (m: EntityManager) => {
    const food = await findFood(
      { id: foodId, household: { id: user!.household.id } },
      m,
    );

    if (!food) {
      throw Missing(`Food with id ${foodId} not found`);
    }

    await createFoodHistory({ foodId: food.id, isInStock, userId: user!.id }, m);
  });

  const reward = await awardSwipe(user!.id, foodId).catch((error) => {
    console.error("Failed to award swipe tickets", error);
    return NO_REWARD;
  });

  return res.status(200).json(reward);
};

export default editFoods;
