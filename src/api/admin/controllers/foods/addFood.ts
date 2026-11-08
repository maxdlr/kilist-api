import { Request, Response } from "express";
import addAdminFood from "../../services/foods/addAdminFood";

const addFood = async ({ body, user: admin }: Request, res: Response) =>
  res.status(201).json(await addAdminFood(admin!, body));

export default addFood;
