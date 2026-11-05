import { Request, Response } from "express";
import recordSwipeSession from "../services/recordSwipeSession";

const completeSwipeList = async ({ user }: Request, res: Response) => {
  await recordSwipeSession(user!.household.id);

  return res.status(201).end();
};

export default completeSwipeList;
