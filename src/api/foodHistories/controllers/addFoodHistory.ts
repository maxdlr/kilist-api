import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import createFoodHistory from "../services/createFoodHistory";
import { EntityManager } from "typeorm";

const addFoodHistory = async ({ body }: Request, res: Response) => {
  const foodHistories: { foodId: number; isInStock: boolean }[] = body;

  for (const foodHistory of foodHistories) {
    await doTransaction(async (m: EntityManager) => {
      await createFoodHistory(foodHistory, m);
    });
  }

  return res.status(200).end();
};

export default addFoodHistory;
