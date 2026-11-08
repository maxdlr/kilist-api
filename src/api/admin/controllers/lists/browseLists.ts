import { Request, Response } from "express";
import browseAdminLists from "../../services/lists/browseAdminLists";

const browseLists = async ({ query }: Request, res: Response) =>
  res.status(200).json(await browseAdminLists(query));

export default browseLists;
