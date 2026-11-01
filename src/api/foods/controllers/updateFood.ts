import { Request, Response } from "express";
import editFood from "../services/editFood";

const updateFood = async ({ body, params, user }: Request, res: Response) => {
  const { id } = params;
  const { name, description } = body;

  if (!id) {
    throw ApiError("Food id is required");
  }

  const food = await editFood(user!.household.id, Number(id), {
    name,
    description,
  });

  return res.status(200).json(food);
};

export default updateFood;
