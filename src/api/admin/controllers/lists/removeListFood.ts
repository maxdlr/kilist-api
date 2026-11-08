import { Request, Response } from "express";
import { idOf } from "../../helpers";
import removeAdminListFood from "../../services/lists/removeAdminListFood";

const removeListFood = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await removeAdminListFood(admin!, idOf(params.id), idOf(params.foodId, "food id")));

export default removeListFood;
