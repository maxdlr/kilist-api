import { Request, Response } from "express";
import { prizeCounter } from "../services/tickets";

const browsePrizes = async ({ user }: Request, res: Response) =>
  res.status(200).json(await prizeCounter(user!.id));

export default browsePrizes;
