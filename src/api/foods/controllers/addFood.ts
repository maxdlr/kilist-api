import { Request, Response } from "express";
import createFood from "../services/createFood";

const ONBOARDING_IN_STOCK_SCORE = 0.5;

const addFood = async ({ body, user }: Request, res: Response) => {
  const { name, description, listId, fromOnboarding } = body;

  if (!name) {
    throw ApiError("name is required");
  }

  if (!listId) {
    throw ApiError("listId is required");
  }

  const food = await createFood(user!.household.id, Number(listId), {
    name,
    description,
    ...(fromOnboarding === true && {
      inStockScore: ONBOARDING_IN_STOCK_SCORE,
    }),
  });

  return res.status(201).json(food);
};

export default addFood;
