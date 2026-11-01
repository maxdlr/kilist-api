import { Request, Response } from "express";
import { IsNull, MoreThan, Or } from "typeorm";
import createShopList from "../services/createShopList";
import findShopList from "../services/findShopList";

const addShopList = async ({ user }: Request, res: Response) => {
  const householdId = user!.household.id;

  const existingOpenShopList = await findShopList({
    household: { id: householdId },
    endedAt: Or(IsNull(), MoreThan(new Date())),
  });

  if (existingOpenShopList) {
    return res.status(200).json(existingOpenShopList.id);
  }

  const shopList = await createShopList(householdId);

  return res.status(200).json(shopList.id || null);
};

export default addShopList;
