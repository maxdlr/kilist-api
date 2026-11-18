import NewsEventEntity from "@/entities/NewsEventEntity";
import NewsRepository from "@/repositories/NewsRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

export type NewsEngagement = { opened: number; pushOpens: number; cardOpens: number; closed: number };

export const NO_ENGAGEMENT: NewsEngagement = { opened: 0, pushOpens: 0, cardOpens: 0, closed: 0 };

const newsEngagement = async (ids: number[], manager?: EntityManager) => {
  const result = new Map<number, NewsEngagement>(ids.map((id) => [id, { ...NO_ENGAGEMENT }]));
  if (ids.length === 0) return result;
  const m = findManager(NewsRepository, manager);
  const kinds = await m
    .createQueryBuilder(NewsEventEntity, "event")
    .select("event.newsId", "newsId")
    .addSelect("event.kind", "kind")
    .addSelect("COUNT(*)", "count")
    .where("event.newsId IN (:...ids)", { ids })
    .groupBy("event.newsId")
    .addGroupBy("event.kind")
    .getRawMany<{ newsId: number; kind: string; count: string }>();
  const openers = await m
    .createQueryBuilder(NewsEventEntity, "event")
    .select("event.newsId", "newsId")
    .addSelect("COUNT(DISTINCT event.installId)", "count")
    .where("event.newsId IN (:...ids)", { ids })
    .andWhere("event.kind IN (:...kinds)", { kinds: ["push_open", "card_open"] })
    .groupBy("event.newsId")
    .getRawMany<{ newsId: number; count: string }>();

  for (const row of kinds) {
    const entry = result.get(Number(row.newsId));
    if (!entry) continue;
    const count = Number(row.count);
    if (row.kind === "push_open") entry.pushOpens = count;
    if (row.kind === "card_open") entry.cardOpens = count;
    if (row.kind === "card_close") entry.closed = count;
  }
  for (const row of openers) {
    const entry = result.get(Number(row.newsId));
    if (entry) entry.opened = Number(row.count);
  }
  return result;
};

export default newsEngagement;
