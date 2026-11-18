import { newsLangs } from "@/api/news/helpers";
import NewsEntity from "@/entities/NewsEntity";
import NewsRepository from "@/repositories/NewsRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import { pageOf } from "../../helpers";

export const adminNewsView = (news: NewsEntity) => ({
  id: news.id,
  titleEn: news.titleEn,
  bodyEn: news.bodyEn,
  titleFr: news.titleFr,
  bodyFr: news.bodyFr,
  url: news.url ?? null,
  langs: newsLangs(news),
  sendAt: news.sendAt,
  status: news.status,
  sentAt: news.sentAt ?? null,
  delivered: news.delivered,
  failed: news.failed,
  author: news.author ? { id: news.author.id, username: news.author.username } : null,
});

const browseAdminNews = async (query: Record<string, unknown>, manager?: EntityManager) => {
  const { offset, limit } = pageOf(query);
  const [items, total] = await findManager(NewsRepository, manager).findAndCount(NewsEntity, {
    relations: { author: true },
    order: { sendAt: "DESC", id: "DESC" },
    skip: offset,
    take: limit,
  });
  return { total, items: items.map(adminNewsView) };
};

export default browseAdminNews;
