import { Request, Response } from "express";
import findAllFoods from "../services/findAllFoods";

const browseFoods = async ({ query }: Request, res: Response) => {
  const { limit } = query;
  const foods = await findAllFoods({
    take: limit ? parseInt(limit as string, 10) : undefined,
  });
  return res.status(200).json(foods);
};

export default browseFoods;
