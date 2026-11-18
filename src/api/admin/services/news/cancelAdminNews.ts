import { newsName } from "@/api/news/helpers";
import NewsEntity from "@/entities/NewsEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import logAction from "../actions/logAction";

const cancelAdminNews = (admin: UserEntity, id: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const news = await m.findOne(NewsEntity, { where: { id } });
    if (!news) throw Missing(`News ${id} not found`);
    if (news.status === "sending") throw ApiError(400, "This news is being sent right now");
    await m.update(NewsEntity, id, { status: "cancelled" });
    const what = news.status === "draft" ? "Discarded" : news.status === "scheduled" ? "Cancelled" : "Hid";
    await logAction(admin, "news", id, `${what} news "${newsName(news)}"`, m);
    return { id, status: "cancelled" };
  });

export default cancelAdminNews;
