import { langOf } from "@/i18n";
import { Request, Response } from "express";
import findCurrentNews from "../services/findCurrentNews";

const browseNews = async (req: Request, res: Response) => res.status(200).json(await findCurrentNews(langOf(req)));

export default browseNews;
