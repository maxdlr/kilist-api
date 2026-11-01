import { Request, Response } from "express";
import removeFoodsFromList from "../services/removeFoodsFromList";

const removeFoods = async ({ body, params, user }: Request, res: Response) => {
  const { id: listId } = params;
  const { foodIds } = body;

  if (!listId) {
    throw ApiError("List id is required");
  }

  if (!Array.isArray(foodIds) || foodIds.length === 0) {
    throw ApiError("foodIds must be a non-empty array");
  }

  const list = await removeFoodsFromList(
    user!.household.id,
    Number(listId),
    foodIds.map(Number),
  );

  return res.status(200).json(list);
};

export default removeFoods;
