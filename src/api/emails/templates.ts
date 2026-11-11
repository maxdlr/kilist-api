import { Lang } from "@/i18n";
import en, { EmailContent } from "./content/en";
import fr from "./content/fr";
import { EmailSettings } from "./helpers";
import { codeBlock, numberedBlock, playersBlock, rowsBlock, skinNameBlock, wordBlock } from "./layout/blocks";
import { calmTheme as calm, roastTheme, versusTheme } from "./layout/themes";
import { EmailParts, renderTicket } from "./layout/ticket";

const CONTENT: Record<Lang, EmailContent> = { en, fr };

type Recipient = { name: string; email: string };
type CodeVars = Recipient & { code: string; minutes: number };
type MemberVars = Recipient & { member: string; household: string; players: number };

export type EmailVars = {
  passwordReset: CodeVars;
  signupConfirm: CodeVars;
  memberJoined: MemberVars;
  accountDeleted: Recipient & { lastInHousehold: boolean };
  releaseUpdate: Pick<Recipient, "email"> & {
    subject: string;
    version: string;
    items: string[];
    unsubscribeUrl: string;
  };
  memberLeft: MemberVars;
  purchaseConfirm: Recipient & {
    skin: string;
    price: string;
    date: string;
    orderId: string;
    store: string;
  };
  skinUnlock: Pick<Recipient, "email"> & {
    skin: "versus" | "roast";
    tickets: number;
    balance: number;
  };
};

export type EmailId = keyof EmailVars;

type Template<K extends EmailId> = (
  copy: EmailContent[K],
  vars: EmailVars[K],
  settings: EmailSettings,
) => EmailParts;

const buttonTo = (label: string, url: string | null) => (url ? { label, url } : undefined);

const TEMPLATES: { [K in EmailId]: Template<K> } = {
  passwordReset: (copy, vars) => ({
    theme: calm,
    subject: copy.subject(vars.code),
    preheader: copy.preheader(vars.minutes),
    title: copy.title(vars.name),
    hero: codeBlock(vars.code, calm),
    note: copy.note(vars.minutes),
    paragraphs: [copy.body, copy.notYou],
    footer: copy.footer(vars.email),
  }),

  signupConfirm: (copy, vars) => ({
    theme: calm,
    subject: copy.subject(vars.code),
    preheader: copy.preheader,
    title: copy.title(vars.name),
    hero: codeBlock(vars.code, calm),
    note: copy.note(vars.minutes),
    paragraphs: [copy.body, copy.notYou],
    footer: copy.footer(vars.email),
  }),

  memberJoined: (copy, vars, settings) => ({
    theme: calm,
    subject: copy.subject(vars.member),
    preheader: copy.preheader,
    title: copy.title(vars.member),
    hero: playersBlock(vars.name, vars.member, calm),
    note: copy.note(vars.household, vars.players),
    paragraphs: [copy.body],
    button: buttonTo(copy.button, settings.appUrl),
    closing: copy.notYou(vars.member, settings.support),
    footer: copy.footer(vars.email, vars.household),
  }),

  accountDeleted: (copy, vars, settings) => ({
    theme: calm,
    subject: copy.subject,
    preheader: copy.preheader,
    title: copy.title,
    hero: wordBlock(copy.hero, calm),
    note: copy.note(vars.name),
    paragraphs: [
      copy.body,
      ...(vars.lastInHousehold ? [copy.lastInHousehold] : []),
      copy.notYou(settings.support),
    ],
    footer: copy.footer(vars.email),
  }),

  releaseUpdate: (copy, vars, settings) => ({
    theme: calm,
    subject: vars.subject,
    preheader: copy.preheader,
    title: `${copy.title} · ${vars.version}`,
    hero: numberedBlock(vars.items, calm),
    button: buttonTo(copy.button, settings.appUrl),
    footer: copy.footer(vars.email),
    footerLink: { label: copy.unsubscribe, url: vars.unsubscribeUrl },
  }),

  memberLeft: (copy, vars, settings) => ({
    theme: calm,
    subject: copy.subject(vars.member),
    preheader: copy.preheader,
    title: copy.title(vars.member),
    hero: playersBlock(vars.name, null, calm),
    note: copy.note(vars.household, vars.players),
    paragraphs: [copy.body],
    button: buttonTo(copy.button, settings.appUrl),
    footer: copy.footer(vars.email, vars.household),
  }),

  purchaseConfirm: (copy, vars, settings) => ({
    theme: calm,
    subject: copy.subject(vars.skin),
    preheader: copy.preheader,
    title: copy.title(vars.name),
    hero: rowsBlock(
      [
        { label: copy.rows.item, value: copy.rows.itemValue(vars.skin) },
        { label: copy.rows.price, value: vars.price },
        { label: copy.rows.date, value: vars.date },
        { label: copy.rows.order, value: vars.orderId },
      ],
      calm,
    ),
    paragraphs: [copy.body],
    button: buttonTo(copy.button(vars.skin), settings.appUrl),
    closing: copy.store(vars.store),
    footer: copy.footer(vars.email),
  }),

  skinUnlock: (copy, vars, settings) => {
    if (vars.skin === "versus") {
      const skin = copy.versus;
      return {
        theme: versusTheme,
        subject: skin.subject,
        preheader: skin.preheader,
        stub: skin.stub,
        title: skin.title,
        hero: skinNameBlock(skin.hero, versusTheme),
        note: skin.note(vars.tickets, vars.balance),
        lead: skin.tagline,
        paragraphs: [skin.body],
        button: buttonTo(skin.button, settings.appUrl),
        footer: copy.footer(vars.email),
      };
    }

    const skin = copy.roast;
    return {
      theme: roastTheme,
      subject: skin.subject,
      preheader: skin.preheader(vars.tickets),
      stub: skin.stub,
      title: skin.title,
      hero: skinNameBlock(skin.hero, roastTheme),
      note: skin.note(vars.tickets, vars.balance),
      lead: skin.tagline,
      button: buttonTo(skin.button, settings.appUrl),
      footer: copy.footer(vars.email),
    };
  },
};

export const renderEmail = <K extends EmailId>(
  id: K,
  vars: EmailVars[K],
  lang: Lang,
  settings: EmailSettings,
) => renderTicket(TEMPLATES[id](CONTENT[lang][id], vars, settings), lang);
