import { FOOD_BANKS } from "@/api/food-bank/foodBank";
import { PRIZES } from "@/api/prizes/catalog";
import { Request, Response } from "express";

const readCatalog = (_req: Request, res: Response) =>
  res.status(200).json({ foodBanks: FOOD_BANKS, prizes: PRIZES });

export default readCatalog;
