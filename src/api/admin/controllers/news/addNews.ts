import { Request, Response } from "express";
import addAdminNews from "../../services/news/addAdminNews";

const addNews = async ({ body, user: admin }: Request, res: Response) =>
  res.status(201).json(await addAdminNews(admin!, body));

export default addNews;
