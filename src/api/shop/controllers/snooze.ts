import snoozeFood from "@/api/foods/services/snoozeFood";
import { Request, Response } from "express";

const snooze = async ({ body }: Request, res: Response) => {
  const { foodId } = body;
  await snoozeFood(Number(foodId));
  return res.status(200).end();
};
export default snooze;
