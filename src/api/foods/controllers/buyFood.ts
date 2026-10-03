import resetFoodHistories from "@/api/foodHistories/services/resetFoodHistories";
import updateFrequencies from "@/api/frequencies/services/updateFrequencies";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { EntityManager } from "typeorm";

const buyFood = async ({ body }: Request, res: Response) => {
  const { previous, current } = body;

  await doTransaction(async (m: EntityManager) => {
    await updateFrequencies({ previous, current }, m);
    await resetFoodHistories(current, m);
  });

  return res.status(200).end();
};

export default buyFood;
