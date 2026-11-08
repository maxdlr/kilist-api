import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import redeemPrize from "../services/redeemPrize";

const redeem = async ({ params, user }: Request, res: Response) => {
  const prizeId = String(params.id ?? "");
  const counter = await doTransaction((m) => redeemPrize(user!.id, prizeId, m));
  return res.status(201).json(counter);
};

export default redeem;
