import { DEFAULT_LANG, Lang } from ".";

const MESSAGES = {
  "errors.generic": {
    en: "Something went wrong. Try again.",
    fr: "Un problème est survenu. Réessaie.",
  },
  "code.invalid": {
    en: "That code isn't right. Check it and try again.",
    fr: "Ce code n'est pas bon. Vérifie-le et réessaie.",
  },
  "code.expired": {
    en: "That code has expired. Ask for a new one.",
    fr: "Ce code a expiré. Demandes-en un nouveau.",
  },
  "code.tooManyAttempts": {
    en: "Too many tries. Ask for a new code.",
    fr: "Trop d'essais. Demande un nouveau code.",
  },
  "product.badCode": {
    en: "That barcode can't be read. Type the name instead.",
    fr: "Ce code-barres est illisible. Tape plutôt le nom.",
  },
  "product.notFound": {
    en: "We don't know that product. Type its name instead.",
    fr: "On ne connaît pas ce produit. Tape plutôt son nom.",
  },
  "product.unavailable": {
    en: "The product lookup isn't answering. Type the name instead.",
    fr: "La recherche de produit ne répond pas. Tape plutôt le nom.",
  },
  "notifications.invalid": {
    en: "That notification choice isn't available.",
    fr: "Ce choix de notification n'est pas disponible.",
  },
  "auth.badCredentials": {
    en: "Wrong email or password.",
    fr: "E-mail ou mot de passe incorrect.",
  },
  "auth.required": {
    en: "Please log in again.",
    fr: "Reconnecte-toi.",
  },
  "auth.forbidden": {
    en: "You can't do that.",
    fr: "Tu ne peux pas faire ça.",
  },
  "auth.userExists": {
    en: "An account already uses this email or username.",
    fr: "Un compte utilise déjà cet e-mail ou ce nom.",
  },
  "account.adminUndeletable": {
    en: "The admin account can't be deleted.",
    fr: "Le compte admin ne peut pas être supprimé.",
  },
  "household.codeNotFound": {
    en: "No household uses this code.",
    fr: "Aucun foyer n'utilise ce code.",
  },
  "email.unconfirmed": {
    en: "Confirm your email first.",
    fr: "Confirme d'abord ton e-mail.",
  },
  "household.alreadyMember": {
    en: "You're already in this household.",
    fr: "Tu fais déjà partie de ce foyer.",
  },
  "skins.unknown": {
    en: "This look doesn't exist.",
    fr: "Ce style n'existe pas.",
  },
  "skins.locked": {
    en: "Unlock this look first.",
    fr: "Débloque d'abord ce style.",
  },
  "prizes.notEnough": {
    en: "Not enough points yet.",
    fr: "Pas encore assez de points.",
  },
  "prizes.alreadyOwned": {
    en: "You already have this one.",
    fr: "Tu l'as déjà.",
  },
  "race.finished": {
    en: "You already finished today's race.",
    fr: "Tu as déjà fini la course du jour.",
  },
  "race.notInRace": {
    en: "This food isn't in today's race.",
    fr: "Cet aliment ne fait pas partie de la course du jour.",
  },
  "shop.completed": {
    en: "This shopping trip is already over.",
    fr: "Ces courses sont déjà terminées.",
  },
  "validation.username.required": {
    en: "Pick a name.",
    fr: "Choisis un nom.",
  },
  "validation.username.short": {
    en: "Your name needs at least 3 characters.",
    fr: "Ton nom doit faire au moins 3 caractères.",
  },
  "validation.email.invalid": {
    en: "That doesn't look like an email.",
    fr: "Cet e-mail n'a pas l'air valide.",
  },
  "validation.password.weak": {
    en: "Your password needs 8 characters, including a number and a symbol.",
    fr: "Ton mot de passe doit faire 8 caractères, avec un chiffre et un symbole.",
  },
  "validation.name.required": {
    en: "Give it a name.",
    fr: "Donne-lui un nom.",
  },
  "validation.url.invalid": {
    en: "That link isn't valid.",
    fr: "Ce lien n'est pas valide.",
  },
} satisfies Record<string, Record<Lang, string>>;

export type MessageCode = keyof typeof MESSAGES;

export const isMessageCode = (value: unknown): value is MessageCode =>
  typeof value === "string" && value in MESSAGES;

export const translate = (code: MessageCode, lang: Lang = DEFAULT_LANG) =>
  MESSAGES[code][lang];
