import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { In, LessThan } from "typeorm";
import findAllFoods from "../services/findAllFoods";
import findFoodSwipes from "../services/findFoodSwipes";

const browseFoods = async ({ query }: Request, res: Response) => {
  const { take, forSwipes, listIds, maxInStockScore } = query;

  return await doTransaction(async (m) => {
    if (forSwipes) {
      const foodSwipes = await findFoodSwipes(
        {
          take: take ? parseInt(take as string, 10) : 10,
        },
        m,
      );

      if (foodSwipes && foodSwipes.length > 0) {
        return res.status(200).json(foodSwipes);
      }
    }

    const foods = await findAllFoods(
      {
        take: take ? parseInt(take as string, 10) : undefined,
        where: {
          lists: listIds
            ? { id: In((listIds as string[]).map((id) => Number(id))) }
            : undefined,
          inStockScore: LessThan(maxInStockScore ? Number(maxInStockScore) : 2),
        },
      },
      m,
    );

    return res.status(200).json(foods);
  });
};

export default browseFoods;
