import deliverPush from "@/api/push/services/deliverPush";
import NewsEntity from "@/entities/NewsEntity";
import NewsRepository from "@/repositories/NewsRepository";
import findManager from "@/utils/findManager";
import { EntityManager, LessThanOrEqual } from "typeorm";
import { NEWS_EVENT, newsText } from "../helpers";
import newsRecipients from "./newsRecipients";

const dispatchDueNews = async (now = new Date(), manager?: EntityManager) => {
  const m = findManager(NewsRepository, manager);
  const due = await m.find(NewsEntity, {
    where: { status: "scheduled", sendAt: LessThanOrEqual(now) },
    order: { sendAt: "ASC" },
  });
  let sent = 0;
  for (const news of due) {
    const claimed = await m.update(NewsEntity, { id: news.id, status: "scheduled" }, { status: "sending" });
    if (!claimed.affected) continue;
    try {
      const recipients = await newsRecipients(m);
      const messages = recipients.flatMap(({ to, lang }) => {
        const text = newsText(news, lang);
        return text ? [{ to, ...text, url: news.url ?? "/", event: NEWS_EVENT }] : [];
      });
      const { delivered, failed } = await deliverPush(messages);
      await m.update(NewsEntity, news.id, { status: "sent", sentAt: new Date(), delivered, failed });
      sent += 1;
    } catch (error) {
      console.error(`Failed to send news ${news.id}`, (error as Error)?.message ?? error);
      await m.update(NewsEntity, news.id, { status: "failed", sentAt: new Date() });
    }
  }
  return sent;
};

export default dispatchDueNews;
