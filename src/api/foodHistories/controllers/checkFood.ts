import updateFrequencies from "@/api/frequencies/services/updateFrequencies";
import { Request, Response } from "express";

const checkFood = async ({ body }: Request, res: Response) => {
  const { previous, current } = body;
  await updateFrequencies({ previous, current });
  return res.status(200).end();
};

export default checkFood;
