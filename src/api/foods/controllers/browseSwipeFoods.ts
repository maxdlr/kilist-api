import { Request, Response } from "express";
import findFoodSwipes from "../services/findFoodSwipes";

const browseSwipeFoods = async (_: Request, res: Response) => {
  const foodSwipes = await findFoodSwipes({
    take: 10,
  });

  return res.status(200).json(foodSwipes);
};

export default browseSwipeFoods;
