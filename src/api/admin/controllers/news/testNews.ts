import { Request, Response } from "express";
import testAdminNews from "../../services/news/testAdminNews";

const testNews = async ({ body, user: admin }: Request, res: Response) =>
  res.status(200).json(await testAdminNews(admin!, body));

export default testNews;
