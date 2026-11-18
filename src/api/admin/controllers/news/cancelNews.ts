import { Request, Response } from "express";
import { idOf } from "../../helpers";
import cancelAdminNews from "../../services/news/cancelAdminNews";

const cancelNews = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await cancelAdminNews(admin!, idOf(params.id)));

export default cancelNews;
