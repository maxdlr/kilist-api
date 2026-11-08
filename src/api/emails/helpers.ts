import UserEntity from "@/entities/UserEntity";
import { DEFAULT_LANG, isLang, Lang } from "@/i18n";

export type EmailSettings = {
  from: string;
  support: string;
  appUrl: string | null;
  smtp: { host: string; port: number; user: string; password: string } | null;
};

const DEFAULT_SMTP_PORT = 587;

export const emailSettings = (): EmailSettings => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM, EMAIL_SUPPORT, EMAIL_APP_URL } =
    process.env;
  const from = EMAIL_FROM ?? "";

  return {
    from,
    support: EMAIL_SUPPORT ?? from,
    appUrl: EMAIL_APP_URL || null,
    smtp:
      SMTP_HOST && SMTP_USER && SMTP_PASSWORD && from
        ? {
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || DEFAULT_SMTP_PORT,
            user: SMTP_USER,
            password: SMTP_PASSWORD,
          }
        : null,
  };
};

export const emailLang = (user: Pick<UserEntity, "language" | "deviceLanguage">): Lang => {
  if (isLang(user.language)) return user.language;
  return isLang(user.deviceLanguage) ? user.deviceLanguage : DEFAULT_LANG;
};

export const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
