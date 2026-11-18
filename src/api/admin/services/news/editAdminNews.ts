import { EDITABLE, parseNewsFor, newsName } from "@/api/news/helpers";
import NewsEntity from "@/entities/NewsEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager, In } from "typeorm";
import logAction from "../actions/logAction";
import readAdminNews from "./readAdminNews";

const editAdminNews = (
  admin: UserEntity,
  id: number,
  body: Record<string, unknown> | undefined,
  manager?: EntityManager,
) => {
  const { draft, input } = parseNewsFor(body);
  return inTransaction(manager, async (m) => {
    const news = await m.findOne(NewsEntity, { where: { id } });
    if (!news) throw Missing(`News ${id} not found`);
    const updated = await m.update(
      NewsEntity,
      { id, status: In(EDITABLE) },
      { ...input, status: draft ? "draft" : "scheduled" },
    );
    if (!updated.affected) throw ApiError(400, "Only drafts and scheduled news can be edited");
    const summary = draft
      ? `Edited draft "${newsName(input)}"`
      : `Scheduled news "${newsName(input)}" for ${input.sendAt.toISOString()}`;
    await logAction(admin, "news", id, summary, m);
    return readAdminNews(id, m);
  });
};

export default editAdminNews;
