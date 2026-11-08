import ShopListEntity, { ShopListStatus } from "@/entities/ShopListEntity";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { IsNull, MoreThan, Or } from "typeorm";
import createShopList from "../services/createShopList";
import findShopList from "../services/findShopList";
import updateShopList from "../services/updateShopList";

const addShopList = async ({ user }: Request, res: Response) => {
  const householdId = user!.household.id;

  const shopListId = await doTransaction(async (m) => {
    const existingOpenShopList: ShopListEntity | null = await findShopList(
      {
        household: { id: householdId },
        endedAt: Or(IsNull(), MoreThan(new Date())),
      },
      m,
    );

    if (existingOpenShopList && existingOpenShopList.startFoods.length > 0) {
      return existingOpenShopList.id;
    }

    if (existingOpenShopList) {
      await updateShopList(
        {
          id: existingOpenShopList.id,
          status: ShopListStatus.COMPLETED,
          endedAt: new Date(),
        },
        m,
      );
    }

    const shopList = await createShopList(householdId, m, user!.id);

    return shopList?.id ?? null;
  });

  return res.status(200).json(shopListId);
};

export default addShopList;
