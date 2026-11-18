import { text } from "@/api/admin/helpers";
import NewsEntity, { NewsStatus } from "@/entities/NewsEntity";
import { DEFAULT_LANG, Lang } from "@/i18n";

export const NEWS_EVENT = "productNews";
export const NEWS_MAX_AGE_DAYS = 30;
export const NEWS_LIMIT = 5;
export const NEWS_LOOP_MS = 30_000;

const APP_URL = /^\/[A-Za-z0-9_\-/]*(\?[A-Za-z0-9_\-=&]*)?$/;

const WEB_URL = /^https?:\/\/[^\s/?#]+\.[^\s/?#]+(?:[/?#]\S*)?$/i;

export const isAppUrl = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 255 && !value.startsWith("//") && APP_URL.test(value);

export const isWebUrl = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 255 && WEB_URL.test(value);

export type NewsInput = Pick<NewsEntity, "titleEn" | "bodyEn" | "titleFr" | "bodyFr" | "url" | "sendAt">;
type NewsTexts = Pick<NewsEntity, "titleEn" | "bodyEn" | "titleFr" | "bodyFr">;

export const NEWS_LANGS: Lang[] = ["en", "fr"];

const FIELDS: Record<Lang, { title: keyof NewsTexts; body: keyof NewsTexts; name: string }> = {
  en: { title: "titleEn", body: "bodyEn", name: "English" },
  fr: { title: "titleFr", body: "bodyFr", name: "French" },
};

export const langOrDefault = (lang: string | null | undefined): Lang => (lang === "fr" ? "fr" : DEFAULT_LANG);

export const newsText = (news: NewsTexts, lang: Lang | string) => {
  const { title, body } = FIELDS[langOrDefault(lang)];
  return news[title] && news[body] ? { title: news[title], body: news[body] } : null;
};

export const newsLangs = (news: NewsTexts) => NEWS_LANGS.filter((lang) => newsText(news, lang));

export const newsName = (news: NewsTexts) => news.titleEn || news.titleFr || "Untitled";

export const parseNews = (
  body: Record<string, unknown> | undefined,
  { needsDate = true, needsText = true } = {},
): NewsInput => {
  const url = body?.url === undefined || body?.url === null || body?.url === "" ? null : body.url;
  if (url !== null && !isAppUrl(url) && !isWebUrl(url)) {
    throw ApiError("url must be an app route like /account?panel=theme or a web link like https://kilist.app");
  }
  const sendAt = new Date(String(body?.sendAt ?? ""));
  if (needsDate && Number.isNaN(sendAt.getTime())) throw ApiError("sendAt must be a date");
  const texts: NewsTexts = {
    titleEn: text(body?.titleEn, "titleEn", { optional: true, max: 120 }) ?? "",
    bodyEn: text(body?.bodyEn, "bodyEn", { optional: true, max: 500 }) ?? "",
    titleFr: text(body?.titleFr, "titleFr", { optional: true, max: 120 }) ?? "",
    bodyFr: text(body?.bodyFr, "bodyFr", { optional: true, max: 500 }) ?? "",
  };
  if (needsText) {
    for (const lang of NEWS_LANGS) {
      const { title, body: content, name } = FIELDS[lang];
      if (Boolean(texts[title]) !== Boolean(texts[content])) {
        throw ApiError(`Give the ${name} news both a title and a content, or leave both empty`);
      }
    }
    if (newsLangs(texts).length === 0) throw ApiError("Write the news in at least one language");
  }
  return { ...texts, url, sendAt: Number.isNaN(sendAt.getTime()) ? new Date() : sendAt };
};

export const EDITABLE: NewsStatus[] = ["draft", "scheduled"];

export const parseNewsFor = (body: Record<string, unknown> | undefined) => {
  const draft = body?.draft === true;
  return { draft, input: parseNews(body, { needsDate: !draft, needsText: !draft }) };
};
