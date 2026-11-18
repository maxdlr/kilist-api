import { NO_ENGAGEMENT } from "@/api/news/services/newsEngagement";
import { parseNewsFor, newsName } from "@/api/news/helpers";
import NewsEntity from "@/entities/NewsEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import logAction from "../actions/logAction";
import { adminNewsView } from "./browseAdminNews";

const addAdminNews = (admin: UserEntity, body: Record<string, unknown> | undefined, manager?: EntityManager) => {
  const { draft, input } = parseNewsFor(body);
  return inTransaction(manager, async (m) => {
    const news = await m.save(NewsEntity, {
      ...input,
      status: draft ? "draft" : "scheduled",
      author: { id: admin.id } as UserEntity,
    } as NewsEntity);
    const summary = draft
      ? `Drafted news "${newsName(news)}"`
      : `Scheduled news "${newsName(news)}" for ${news.sendAt.toISOString()}`;
    await logAction(admin, "news", news.id, summary, m);
    return adminNewsView({ ...news, author: admin }, NO_ENGAGEMENT);
  });
};

export default addAdminNews;
