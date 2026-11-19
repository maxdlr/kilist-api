import { Request, Response } from "express";
import editFood from "../services/editFood";

const updateFood = async ({ body, params, user }: Request, res: Response) => {
  const { id } = params;
  const { name, note, quantity, aisle, frequencyDays } = body;

  if (!id) {
    throw ApiError("Food id is required");
  }

  const food = await editFood(user!.household.id, Number(id), {
    name,
    note,
    quantity,
    aisle,
    frequencyDays,
  });

  return res.status(200).json(food);
};

export default updateFood;
