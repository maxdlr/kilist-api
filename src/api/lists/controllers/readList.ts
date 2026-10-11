import { Request, Response } from "express";
import findList from "../services/findList";

const readList = async ({ query }: Request, res: Response) => {
  const { main, id } = query as { main?: boolean; id?: number };

  const list = await findList({
    isMain: main !== undefined ? main : false,
    id: id !== undefined ? Number(id) : undefined,
  });

  return res.status(200).json(list);
};

export default readList;
