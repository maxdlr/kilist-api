import { Request, Response } from "express";
import prizeCounter from "../services/prizeCounter";

const browsePrizes = async ({ user }: Request, res: Response) =>
  res.status(200).json(await prizeCounter(user!.id, undefined, user!.type === "admin"));

export default browsePrizes;
