import { Request, Response } from "express";
import { IsNull, MoreThan, Or } from "typeorm";
import createShopList from "../services/createShopList";
import findShopList from "../services/findShopList";

const addShopList = async (_: Request, res: Response) => {
  const existingOpenShopList = await findShopList({
    endedAt: Or(IsNull(), MoreThan(new Date())),
  });

  if (existingOpenShopList) {
    return res.status(200).json(existingOpenShopList.id);
  }

  const shopList = await createShopList();

  return res.status(200).json(shopList.id || null);
};

export default addShopList;
