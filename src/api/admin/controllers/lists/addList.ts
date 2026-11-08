import { Request, Response } from "express";
import addAdminList from "../../services/lists/addAdminList";

const addList = async ({ body, user: admin }: Request, res: Response) =>
  res.status(201).json(await addAdminList(admin!, body));

export default addList;
