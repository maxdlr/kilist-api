import { Request } from "express";

export const LANGS = ["en", "fr"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export const isLang = (value: unknown): value is Lang =>
  typeof value === "string" && (LANGS as readonly string[]).includes(value);

export const parseAcceptLanguage = (header?: string): Lang | undefined =>
  header
    ?.split(",")
    .map((part) => part.split(";")[0]!.trim().slice(0, 2).toLowerCase())
    .find(isLang);

export const langOf = (req: Pick<Request, "headers" | "user">): Lang =>
  parseAcceptLanguage(req.headers["accept-language"]) ??
  (isLang(req.user?.language) ? req.user.language : DEFAULT_LANG);
