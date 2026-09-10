import { Request, Response } from "express";
import createFoodHistory from "../services/createFoodHistory";

const addFoodHistory = async ({ body }: Request, res: Response) => {
  await createFoodHistory(body);
  return res.status(200).end();
};

export default addFoodHistory;
