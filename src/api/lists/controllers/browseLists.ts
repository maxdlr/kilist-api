import { Request, Response } from "express";
import findAllLists from "../services/findAllLists";

const browseLists = async (_req: Request, res: Response) => {
  const lists = await findAllLists();
  return res.status(200).json(lists);
};

export default browseLists;
