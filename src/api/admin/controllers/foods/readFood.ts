import { Request, Response } from "express";
import { idOf } from "../../helpers";
import readAdminFood from "../../services/foods/readAdminFood";

const readFood = async ({ params }: Request, res: Response) =>
  res.status(200).json(await readAdminFood(idOf(params.id)));

export default readFood;
