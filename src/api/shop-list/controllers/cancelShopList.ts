import { Request, Response } from "express";
import findShopList from "../services/findShopList";
import updateShopList from "../services/updateShopList";
import doTransaction from "@/utils/doTransaction";

const cancelShopList = async ({ params }: Request, res: Response) => {
  if (!params.id) {
    throw ApiError("ShopList id is required");
  }

  return await doTransaction(async (m) => {
    const shopList = await findShopList(
      {
        id: Number(params.id),
      },
      m,
    );

    if (!shopList) {
      return res.status(200).end();
    }

    await updateShopList(
      {
        id: Number(params.id),
        endedAt: new Date(),
      },
      m,
    );
    return res.status(200).end();
  });
};

export default cancelShopList;
