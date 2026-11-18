import NewsEntity from "@/entities/NewsEntity";
import { Lang } from "@/i18n";
import NewsRepository from "@/repositories/NewsRepository";
import findManager from "@/utils/findManager";
import { Between, EntityManager, In } from "typeorm";
import { NEWS_LIMIT, NEWS_MAX_AGE_DAYS, newsText } from "../helpers";

const findCurrentNews = async (lang: Lang, now = new Date(), manager?: EntityManager) => {
  const since = new Date(now.getTime() - NEWS_MAX_AGE_DAYS * 24 * 3600000);
  const items = await findManager(NewsRepository, manager).find(NewsEntity, {
    where: { status: In(["scheduled", "sending", "sent"]), sendAt: Between(since, now) },
    order: { sendAt: "DESC" },
    take: NEWS_LIMIT * 4,
  });
  return items
    .flatMap((news) => {
      const text = newsText(news, lang);
      return text ? [{ id: news.id, ...text, url: news.url ?? null, at: news.sendAt }] : [];
    })
    .slice(0, NEWS_LIMIT);
};

export default findCurrentNews;
