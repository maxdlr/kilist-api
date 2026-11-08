import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import findShopList from "../services/findShopList";
import updateShopList from "../services/updateShopList";

const startShopClock = async ({ params, user }: Request, res: Response) => {
  const id = Number(params.id);

  if (!id || Number.isNaN(id)) {
    throw ApiError("A valid shopListId is required");
  }

  await doTransaction(async (m) => {
    const shopList = await findShopList(
      { id, household: { id: user!.household.id } },
      m,
    );

    if (!shopList) {
      throw Missing(`ShopList with id ${id} not found`);
    }

    await updateShopList({ id, startedAt: new Date() }, m);
  });

  return res.status(200).end();
};

export default startShopClock;
