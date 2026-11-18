import NewsEntity from "@/entities/NewsEntity";
import NewsEventEntity, { NewsEventKind } from "@/entities/NewsEventEntity";
import NewsRepository from "@/repositories/NewsRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In } from "typeorm";

const recordNewsEvent = async (newsId: number, installId: string, kind: NewsEventKind, manager?: EntityManager) => {
  const m = findManager(NewsRepository, manager);
  const news = await m.findOne(NewsEntity, { where: { id: newsId, status: In(["sent", "cancelled"]) } });
  if (!news) throw Missing(`News ${newsId} not found`);
  await m
    .createQueryBuilder()
    .insert()
    .into(NewsEventEntity)
    .values({ news: { id: newsId }, installId, kind })
    .orIgnore()
    .execute();
};

export default recordNewsEvent;
