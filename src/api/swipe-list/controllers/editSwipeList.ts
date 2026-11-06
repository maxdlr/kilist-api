import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import findFood from "@/api/foods/services/findFood";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { EntityManager } from "typeorm";
import findSwipeList from "../services/findSwipeList";
import updateStockFoodToSwipeList from "../services/updateStockFoodToSwipeList";

const editSwipeList = async ({ body, params, user }: Request, res: Response) => {
  const { id: swipeListId } = params;
  const foodHistory: { foodId: number; isInStock: boolean } = body;
  const householdId = user!.household.id;

  if (!swipeListId) {
    throw ApiError("swipeListId is required in query parameters");
  }

  return await doTransaction(async (m: EntityManager) => {
    const swipeList = await findSwipeList(
      { where: { id: Number(swipeListId), household: { id: householdId } } },
      m,
    );

    await createFoodHistory({ ...foodHistory, userId: user!.id }, m);

    if (!swipeList) {
      throw ApiError(`SwipeList with id ${swipeListId} not found`);
    }

    const food = await findFood(
      { id: foodHistory.foodId, household: { id: householdId } },
      m,
    );

    if (!food) {
      throw ApiError(`Food with id ${foodHistory.foodId} not found`);
    }

    const updatedSwipeList = await updateStockFoodToSwipeList(
      swipeList,
      food.id,
      foodHistory.isInStock ? "inStockFoods" : "outOfStockFoods",
      m,
    );

    return res.status(200).send(updatedSwipeList);
  });
};

export default editSwipeList;
