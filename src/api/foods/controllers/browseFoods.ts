import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { ILike, In, LessThan } from "typeorm";
import findAllFoods from "../services/findAllFoods";
import findFoodSwipes from "../services/findFoodSwipes";

const browseFoods = async ({ query, user }: Request, res: Response) => {
  const { take, forSwipes, listIds, maxInStockScore, search } = query;
  const householdId = user!.household.id;

  return await doTransaction(async (m) => {
    if (forSwipes) {
      const foodSwipes = await findFoodSwipes(
        householdId,
        {
          take: take ? parseInt(take as string, 10) : 10,
        },
        m,
      );

      if (foodSwipes && foodSwipes.length > 0) {
        return res.status(200).json(foodSwipes);
      }
    }

    const baseWhere = {
      household: { id: householdId },
      lists: listIds
        ? { id: In((listIds as string[]).map((id) => Number(id))) }
        : undefined,
      inStockScore: LessThan(maxInStockScore ? Number(maxInStockScore) : 2),
    };

    const searchTerm = search ? `%${search}%` : undefined;

    const foods = await findAllFoods(
      {
        take: take ? parseInt(take as string, 10) : undefined,
        where: searchTerm
          ? [
              { ...baseWhere, name: ILike(searchTerm) },
              { ...baseWhere, description: ILike(searchTerm) },
            ]
          : baseWhere,
      },
      m,
    );

    return res.status(200).json(foods);
  });
};

export default browseFoods;
