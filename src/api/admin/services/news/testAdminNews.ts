import { NEWS_EVENT, newsLangs, newsText, parseNews } from "@/api/news/helpers";
import deliverPush from "@/api/push/services/deliverPush";
import findPushTokens from "@/api/push/services/findPushTokens";
import UserEntity from "@/entities/UserEntity";

const testAdminNews = async (admin: UserEntity, body: Record<string, unknown> | undefined) => {
  const news = parseNews(body, { needsDate: false });
  const tokens = await findPushTokens(admin.id);
  if (tokens.length === 0) throw ApiError(400, "No phone with notifications is signed in to your account");
  const messages = newsLangs(news).flatMap((lang) =>
    tokens.map((to) => ({ to, ...newsText(news, lang)!, url: news.url ?? "/", event: NEWS_EVENT })),
  );
  return deliverPush(messages);
};

export default testAdminNews;
