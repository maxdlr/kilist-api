import { Request, Response } from "express";
import { idOf } from "../../helpers";
import unsnoozeAdminFood from "../../services/foods/unsnoozeAdminFood";

const unsnoozeFood = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await unsnoozeAdminFood(admin!, idOf(params.id)));

export default unsnoozeFood;
