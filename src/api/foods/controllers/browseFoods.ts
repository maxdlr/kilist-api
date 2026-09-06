import { Request, Response } from "express";
import findAllFoods from "../services/findAllFoods";

const browseFoods = async ({ query }: Request, res: Response) => {
  const foods = await findAllFoods(query);
  return res.status(200).json(foods);
};

export default browseFoods;
