import { Request, Response } from "express";
import { idOf } from "../../helpers";
import resetAdminFoodScore from "../../services/foods/resetAdminFoodScore";

const resetFoodScore = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await resetAdminFoodScore(admin!, idOf(params.id)));

export default resetFoodScore;
