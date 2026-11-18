import { Request, Response } from "express";
import { idOf } from "../../helpers";
import editAdminNews from "../../services/news/editAdminNews";

const editNews = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await editAdminNews(admin!, idOf(params.id), body));

export default editNews;
