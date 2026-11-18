import NewsEntity from "@/entities/NewsEntity";
import NewsRepository from "@/repositories/NewsRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import { adminNewsView } from "./browseAdminNews";

const readAdminNews = async (id: number, manager?: EntityManager) => {
  const news = await findManager(NewsRepository, manager).findOne(NewsEntity, {
    where: { id },
    relations: { author: true },
  });
  if (!news) throw Missing(`News ${id} not found`);
  return adminNewsView(news);
};

export default readAdminNews;
