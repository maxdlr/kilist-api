import ShopListEntity, { ShopListStatus } from "@/entities/ShopListEntity";
import { Request, Response } from "express";
import { IsNull, MoreThan, Or } from "typeorm";
import createShopList from "../services/createShopList";
import findShopList from "../services/findShopList";
import updateShopList from "../services/updateShopList";

const addShopList = async ({ user }: Request, res: Response) => {
  const householdId = user!.household.id;

  const existingOpenShopList: ShopListEntity | null = await findShopList({
    household: { id: householdId },
    endedAt: Or(IsNull(), MoreThan(new Date())),
  });

  if (existingOpenShopList && existingOpenShopList.startFoods.length > 0) {
    return res.status(200).json(existingOpenShopList.id);
  }

  if (existingOpenShopList) {
    await updateShopList({
      id: existingOpenShopList.id,
      status: ShopListStatus.COMPLETED,
      endedAt: new Date(),
    });
  }

  const shopList = await createShopList(householdId, undefined, user!.id);

  return res.status(200).json(shopList?.id ?? null);
};

export default addShopList;
