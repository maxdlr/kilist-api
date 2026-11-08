import { Request, Response } from "express";
import { idOf } from "../../helpers";
import editAdminFood from "../../services/foods/editAdminFood";

const editFood = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await editAdminFood(admin!, idOf(params.id), body));

export default editFood;
