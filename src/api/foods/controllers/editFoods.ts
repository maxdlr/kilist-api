import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import findFood from "@/api/foods/services/findFood";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { EntityManager } from "typeorm";

const editFoods = async ({ body, params, user }: Request, res: Response) => {
  const { id: foodId } = params;
  const foodHistory: { foodId: number; isInStock: boolean | null } = body;

  if (!foodId) {
    throw ApiError("swipeListId is required in query parameters");
  }

  return await doTransaction(async (m: EntityManager) => {
    const food = await findFood(
      { id: Number(foodId), household: { id: user!.household.id } },
      m,
    );

    if (!food) {
      throw Missing(`Food with id ${foodHistory.foodId} not found`);
    }

    await createFoodHistory(foodHistory, m);

    return res.status(200).end();
  });
};

export default editFoods;
