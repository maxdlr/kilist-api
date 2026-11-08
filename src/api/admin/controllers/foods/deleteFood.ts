import { Request, Response } from "express";
import { idOf } from "../../helpers";
import deleteAdminFood from "../../services/foods/deleteAdminFood";

const deleteFood = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await deleteAdminFood(admin!, idOf(params.id)));

export default deleteFood;
