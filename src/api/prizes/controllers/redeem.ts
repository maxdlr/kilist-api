import notifyUser from "@/api/notifications/services/notifyUser";
import doTransaction from "@/utils/doTransaction";
import { findPrize } from "../catalog";
import { Request, Response } from "express";
import redeemPrize from "../services/redeemPrize";

const redeem = async ({ params, user }: Request, res: Response) => {
  const prizeId = String(params.id ?? "");
  const counter = await doTransaction((m) => redeemPrize(user!.id, prizeId, m));

  const prize = findPrize(prizeId);
  if (prize && (prize.skin === "versus" || prize.skin === "roast")) {
    await notifyUser(user!, "skinUnlock", {
      email: user!.email,
      skin: prize.skin,
      tickets: prize.price,
      balance: counter.balance,
    });
  }
  return res.status(201).json(counter);
};

export default redeem;
