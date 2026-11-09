import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import applyShopAction, { ShopAction } from "../services/applyShopAction";

const ACTIONS: ShopAction[] = ["buy", "snooze"];

const editShopList = async ({ body, params, user }: Request, res: Response) => {
  const { id: shopListId } = params;
  const { foodId, action } = body;
  const householdId = user!.household.id;

  if (!ACTIONS.includes(action)) {
    throw ApiError(`Invalid action. Must be one of: ${ACTIONS.join(", ")}`);
  }

  if (!shopListId) {
    throw ApiError("shopListId is required in query parameters");
  }

  if (!foodId) {
    throw ApiError("foodId are required in the request body");
  }

  const suggested = await doTransaction((m) =>
    applyShopAction(
      {
        householdId,
        shopListId: Number(shopListId),
        foodId: Number(foodId),
        action,
      },
      m,
    ),
  );

  return res.status(200).send(suggested);
};

export default editShopList;
