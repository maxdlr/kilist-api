import { Request, Response } from "express";
import findAllLists from "../services/findAllLists";

const browseLists = async ({ user }: Request, res: Response) => {
  const lists = await findAllLists({ household: { id: user!.household.id } });
  return res.status(200).json(lists);
};

export default browseLists;
