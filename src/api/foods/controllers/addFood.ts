import { Request, Response } from "express";
import createFood from "../services/createFood";

const addFood = async ({ body, user }: Request, res: Response) => {
  const { name, description, listId } = body;

  if (!name) {
    throw ApiError("name is required");
  }

  if (!listId) {
    throw ApiError("listId is required");
  }

  const food = await createFood(user!.household.id, Number(listId), {
    name,
    description,
  });

  return res.status(201).json(food);
};

export default addFood;
