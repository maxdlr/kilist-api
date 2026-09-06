import { Request, Response } from "express";
import updateFrequencies from "../services/updateFrequencies";

const checkFood = async ({ body }: Request, res: Response) => {
  const { previous, current } = body;
  await updateFrequencies({ previous, current });
  return res.status(200).end();
};

export default checkFood;
