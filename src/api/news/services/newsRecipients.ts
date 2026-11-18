import { emailLang } from "@/api/emails/helpers";
import { choiceOf, findEvent } from "@/api/notifications/catalog";
import PushTokenEntity from "@/entities/PushTokenEntity";
import NewsRepository from "@/repositories/NewsRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import { NEWS_EVENT, langOrDefault } from "../helpers";

const newsRecipients = async (manager?: EntityManager) => {
  const m = findManager(NewsRepository, manager);
  const event = findEvent(NEWS_EVENT)!;
  const owned = await m
    .createQueryBuilder(PushTokenEntity, "token")
    .innerJoinAndSelect("token.user", "user")
    .getMany();
  const guests = await m
    .createQueryBuilder(PushTokenEntity, "token")
    .where("token.userId IS NULL")
    .andWhere("token.news = :news", { news: true })
    .getMany();

  return [
    ...owned
      .filter((entry) => ["push", "both"].includes(choiceOf(entry.user!.notifications, event)))
      .map((entry) => ({ to: entry.token, lang: emailLang(entry.user!) })),
    ...guests.map((entry) => ({ to: entry.token, lang: langOrDefault(entry.lang) })),
  ];
};

export default newsRecipients;
