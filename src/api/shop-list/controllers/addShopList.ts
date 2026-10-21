import { Request, Response } from "express";
import { IsNull } from "typeorm";
import createShopList from "../services/createShopList";
import findShopList from "../services/findShopList";

const addShopList = async (_: Request, res: Response) => {
  const existingOpenShopList = await findShopList({
    endedAt: IsNull(),
  });

  if (existingOpenShopList) {
    return res.status(200).json(existingOpenShopList);
  }

  const shopList = await createShopList();

  return res.status(200).json(shopList);
};

export default addShopList;
