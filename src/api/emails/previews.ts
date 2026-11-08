import { Lang } from "@/i18n";
import { EmailId, EmailVars, renderEmail } from "./templates";

const recipient = { name: "Camille", email: "camille@example.com" };
const household = { member: "Sam", household: "The Fridge Raiders" };

export const PREVIEWS: { [K in keyof EmailVars]: EmailVars[K] } = {
  passwordReset: { ...recipient, code: "482917", minutes: 15 },
  signupConfirm: { ...recipient, code: "295064", minutes: 30 },
  memberJoined: { ...recipient, ...household, players: 2 },
  accountDeleted: { ...recipient, lastInHousehold: true },
  releaseUpdate: {
    email: recipient.email,
    subject: "New in Kilist: every item on one screen",
    version: "1.2",
    items: [
      "Arcade shopping now lists every item in swipeable rows",
      "Versus shopping races wait for your START",
      "Removed foods stay out of your shopping list",
    ],
    unsubscribeUrl: "https://example.com/unsubscribe",
  },
  memberLeft: { ...recipient, ...household, players: 1 },
  purchaseConfirm: {
    ...recipient,
    skin: "Versus",
    price: "2,99 €",
    date: "2026-11-08",
    orderId: "GPA.1234-5678",
    store: "Google Play",
  },
  skinUnlock: { email: recipient.email, skin: "versus", tickets: 1000, balance: 120 },
};

export type EmailSkin = "versus" | "roast";

const PREVIEW_SETTINGS = {
  from: "Kilist <hello@example.com>",
  support: "support@example.com",
  appUrl: "https://example.com",
  smtp: null,
};

export const EMAIL_IDS = Object.keys(PREVIEWS) as EmailId[];

export const isEmailId = (value: unknown): value is EmailId =>
  typeof value === "string" && (EMAIL_IDS as string[]).includes(value);

type EmailVariant = { id: EmailId; skin: EmailSkin | null };

export const previewVariants = () =>
  EMAIL_IDS.flatMap<EmailVariant>((id) =>
    id === "skinUnlock"
      ? [
          { id, skin: "versus" as const },
          { id, skin: "roast" as const },
        ]
      : [{ id, skin: null }],
  );

export const renderPreview = (id: EmailId, lang: Lang, skin?: unknown) => {
  const vars =
    id === "skinUnlock" && skin === "roast"
      ? { ...PREVIEWS.skinUnlock, skin: "roast" as const }
      : PREVIEWS[id];

  return renderEmail(id, vars, lang, PREVIEW_SETTINGS);
};
