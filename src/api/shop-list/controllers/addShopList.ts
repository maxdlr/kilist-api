import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import openShopList from "../services/openShopList";

const addShopList = async ({ user }: Request, res: Response) => {
  const shopListId = await doTransaction((m) =>
    openShopList(user!.household.id, user!.id, m),
  );

  return res.status(200).json(shopListId);
};

export default addShopList;
