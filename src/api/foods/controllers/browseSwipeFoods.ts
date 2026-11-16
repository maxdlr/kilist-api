import { RULES } from "@/api/catalog/rules";
import hasSwipedBefore from "@/api/prizes/services/hasSwipedBefore";
import { Request, Response } from "express";
import findFoodSwipes from "../services/findFoodSwipes";

const browseSwipeFoods = async ({ user, query }: Request, res: Response) => {
  const again = query.again === "1";
  const firstGame = !again && !(await hasSwipedBefore(user!.id, null));
  const take = firstGame ? RULES.swipe.firstDeckSize : RULES.swipe.deckSize;

  const foodSwipes = await findFoodSwipes(user!.household.id, { take, again });

  return res.status(200).json(foodSwipes);
};

export default browseSwipeFoods;
