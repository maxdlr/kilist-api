import { Request, Response } from "express";
import findList from "../services/findList";

const readList = async ({ query }: Request, res: Response) => {
  const userId = query.id as string;

  if (!userId) {
    throw ApiError("User ID is required");
  }

  const where = { id: Number(userId) };

  const list = await findList(where);

  return res.status(200).json(list);
};

export default readList;
