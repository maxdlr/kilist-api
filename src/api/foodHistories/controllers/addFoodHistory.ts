import findFood from "@/api/foods/services/findFood";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { EntityManager } from "typeorm";
import createFoodHistory from "../services/createFoodHistory";

const addFoodHistory = async ({ body, user }: Request, res: Response) => {
  const foodHistories: { foodId: number; isInStock: boolean }[] = body;
  const householdId = user!.household.id;

  for (const foodHistory of foodHistories) {
    await doTransaction(async (m: EntityManager) => {
      const food = await findFood(
        { id: foodHistory.foodId, household: { id: householdId } },
        m,
      );

      if (!food) {
        throw Missing(`Food with id ${foodHistory.foodId} not found`);
      }

      await createFoodHistory(foodHistory, m);
    });
  }

  return res.status(200).end();
};

export default addFoodHistory;
