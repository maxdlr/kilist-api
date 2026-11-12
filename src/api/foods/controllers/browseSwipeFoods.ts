import { RULES } from "@/api/catalog/rules";
import { Request, Response } from "express";
import findFoodSwipes from "../services/findFoodSwipes";

const browseSwipeFoods = async ({ user }: Request, res: Response) => {
  const foodSwipes = await findFoodSwipes(user!.household.id, {
    take: RULES.swipe.deckSize,
  });

  return res.status(200).json(foodSwipes);
};

export default browseSwipeFoods;
