import { Request, Response } from "express";
import { idOf } from "../../helpers";
import addAdminListFoods from "../../services/lists/addAdminListFoods";

const addListFoods = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await addAdminListFoods(admin!, idOf(params.id), body?.foodIds));

export default addListFoods;
