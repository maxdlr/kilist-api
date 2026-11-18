import { Request, Response } from "express";
import { idOf } from "../../helpers";
import readAdminNews from "../../services/news/readAdminNews";

const readNews = async ({ params }: Request, res: Response) => res.status(200).json(await readAdminNews(idOf(params.id)));

export default readNews;
