import { Lang } from "@/i18n";

export const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
export const PUSH_BATCH = 100;
const TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$/;

export const isPushToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_PATTERN.test(value);

type PushVars = Record<string, unknown>;
type PushText = (vars: PushVars) => { title: string; body: string; url: string };

const skinName = (skin: unknown) => (skin === "roast" ? "Roast" : skin === "versus" ? "Versus" : String(skin));

export const PUSH_TEXT: Record<Lang, Record<string, PushText>> = {
  en: {
    memberJoined: (v) => ({ title: "New housemate", body: `${v.member} joined ${v.household}.`, url: "/account" }),
    memberLeft: (v) => ({ title: "Household change", body: `${v.member} left ${v.household}.`, url: "/account" }),
    skinUnlock: (v) => ({ title: "Skin unlocked", body: `${skinName(v.skin)} is yours. Try it on.`, url: "/account" }),
    productNews: (v) => ({ title: "Kilist news", body: String(v.subject ?? ""), url: "/" }),
  },
  fr: {
    memberJoined: (v) => ({ title: "Nouveau membre", body: `${v.member} a rejoint ${v.household}.`, url: "/account" }),
    memberLeft: (v) => ({ title: "Changement de foyer", body: `${v.member} a quitté ${v.household}.`, url: "/account" }),
    skinUnlock: (v) => ({ title: "Skin débloqué", body: `${skinName(v.skin)} est à toi. Essaie-le.`, url: "/account" }),
    productNews: (v) => ({ title: "Nouveautés Kilist", body: String(v.subject ?? ""), url: "/" }),
  },
};
