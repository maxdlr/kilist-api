import resetFoodHistories from "@/api/foodHistories/services/resetFoodHistories";
import getMostLikelyNextFoods from "@/api/frequencies/services/getMostLikelyNextFood";
import updateFrequencies from "@/api/frequencies/services/updateFrequencies";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { EntityManager } from "typeorm";

const buyFood = async ({ body }: Request, res: Response) => {
  const { previousFoodId, currentFoodId } = body;

  await doTransaction(async (m: EntityManager) => {
    await updateFrequencies({ previousFoodId, currentFoodId }, m);
    await resetFoodHistories(currentFoodId, m);
  });

  const mostLikelyNextFoodIds = await getMostLikelyNextFoods(currentFoodId);

  console.log({ mostLikelyNextFoodIds });

  return res.status(200).send(mostLikelyNextFoodIds);
};

export default buyFood;
