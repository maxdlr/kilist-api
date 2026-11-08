import { Request, Response } from "express";
import { idOf } from "../../helpers";
import readAdminList from "../../services/lists/readAdminList";

const readList = async ({ params }: Request, res: Response) =>
  res.status(200).json(await readAdminList(idOf(params.id)));

export default readList;
