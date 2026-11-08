import { Request, Response } from "express";
import shopRecords from "../services/shopRecords";

const readShop = async ({ user }: Request, res: Response) =>
  res.status(200).json(await shopRecords(user!));

export default readShop;
