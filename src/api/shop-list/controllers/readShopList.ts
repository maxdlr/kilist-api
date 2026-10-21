import { ShopListStatus } from "@/entities/ShopListEntity";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { IsNull, LessThan, Or } from "typeorm";
import findShopList from "../services/findShopList";
import findShopListRemainingFoods from "../services/findShopListRemainingFoods";
import updateShopList from "../services/updateShopList";

const readShopList = async ({ params }: Request, res: Response) => {
  const shopListId = Number(params.id);

  if (!shopListId || Number.isNaN(shopListId)) {
    throw ApiError("A valid shopListId is required");
  }

  const shopList = await doTransaction(async (m) => {
    let shopList = await findShopList(
      { id: shopListId, endedAt: Or(IsNull(), LessThan(new Date())) },
      m,
    );

    if (!shopList) {
      throw Missing(
        `ShopList with id ${shopListId} not found or has already ended`,
      );
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

  if (!shopList) {
    throw ApiError("ShopList is completed. No more foods to buy.");
  }

  const remainingFoods = findShopListRemainingFoods(shopList);

  return res.status(200).send({
    foods: remainingFoods,
    ...shopList,
  });
};

export default readShopList;
