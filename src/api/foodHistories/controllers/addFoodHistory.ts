import { Request, Response } from "express";
import createFoodHistory from "../services/createFoodHistory";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";

const addFoodHistory = async ({ body }: Request, res: Response) => {
  const foodHistories: { foodId: number; isInStock: boolean }[] = body;

  for (const foodHistory of foodHistories) {
    await FoodHistoryRepository.manager.transaction(async (manager) => {
      await createFoodHistory(foodHistory, manager);
    });
  }

  return res.status(200).end();
};

export default addFoodHistory;
