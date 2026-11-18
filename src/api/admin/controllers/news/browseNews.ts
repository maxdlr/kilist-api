import { Request, Response } from "express";
import browseAdminNews from "../../services/news/browseAdminNews";

const browseNews = async ({ query }: Request, res: Response) => res.status(200).json(await browseAdminNews(query));

export default browseNews;
