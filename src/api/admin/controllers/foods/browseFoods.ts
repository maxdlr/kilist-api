import { Request, Response } from "express";
import browseAdminFoods from "../../services/foods/browseAdminFoods";

const browseFoods = async ({ query }: Request, res: Response) =>
  res.status(200).json(await browseAdminFoods(query));

export default browseFoods;
