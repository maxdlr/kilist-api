import { ShopListStatus } from "@/entities/ShopListEntity";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import findShopList from "../services/findShopList";
import updateShopList from "../services/updateShopList";

const readShopList = async ({ params }: Request, res: Response) => {
  const shopListId = Number(params.id);

  if (!shopListId || Number.isNaN(shopListId)) {
    throw ApiError("A valid shopListId is required");
  }

  const shopList = await doTransaction(async (m) => {
    let shopList = await findShopList({ id: shopListId }, m);

    if (!shopList) {
      throw Missing(`ShopList with id ${shopListId} not found`);
    }

    if (shopList.startFoods.length === 0) {
      throw ApiError("No start foods available for this shopList");
    }

    if (shopList.startFoods.length === shopList.boughtFoods.length) {
      shopList = await updateShopList(
        {
          id: shopListId,
          status: ShopListStatus.COMPLETED,
          endedAt: new Date(),
        },
        m,
      );

      return null;
    }

    return shopList;
  });

  return res.status(200).send(shopList);
};

export default readShopList;
