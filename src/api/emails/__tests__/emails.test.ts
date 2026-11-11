import { LANGS } from "@/i18n";
import { Request, Response } from "express";
import EmailLogRepository from "@/repositories/EmailLogRepository";
import nodemailer from "nodemailer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../content/en";
import fr from "../content/fr";
import browseEmailPreviews from "../controllers/browseEmailPreviews";
import readEmailPreview from "../controllers/readEmailPreview";
import { emailLang, EmailSettings } from "../helpers";
import { PREVIEWS } from "../previews";
import sendEmail from "../services/sendEmail";
import { EmailId, renderEmail } from "../templates";

const settings: EmailSettings = {
  from: "Kilist <hello@example.com>",
  support: "support@example.com",
  appUrl: "https://example.com",
  smtp: null,
};

const IDS = Object.keys(PREVIEWS) as EmailId[];
const SMTP_ENV = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM", "EMAIL_SUPPORT", "EMAIL_APP_URL"];

const clearEnv = () => SMTP_ENV.forEach((key) => delete process.env[key]);

const render = <K extends EmailId>(id: K, lang: (typeof LANGS)[number] = "en", overrides = settings) =>
  renderEmail(id, PREVIEWS[id], lang, overrides);

describe("rendering", () => {
  it.each(IDS.flatMap((id) => LANGS.map((lang) => [id, lang] as const)))(
    "builds %s in %s with no missing values",
    (id, lang) => {
      const email = render(id, lang);

      expect(email.subject.length).toBeGreaterThan(0);
      expect(email.html).toContain(`<html lang="${lang}">`);
      expect(email.text.length).toBeGreaterThan(0);
      for (const output of [email.subject, email.html, email.text]) {
        expect(output).not.toMatch(/undefined|\[object|NaN|function/);
      }
    },
  );

  it("shows the code and its expiry in the password reset", () => {
    const email = render("passwordReset");

    expect(email.subject).toContain("482917");
    expect(email.html).toContain("482917");
    expect(email.text).toContain("Valid for 15 minutes");
  });

  it("uses the chosen language", () => {
    expect(render("passwordReset", "fr").text).toContain("Valable 15 minutes");
    expect(en.accountDeleted.hero).not.toBe(fr.accountDeleted.hero);
  });

  it("escapes values coming from users", () => {
    const email = renderEmail(
      "memberJoined",
      { ...PREVIEWS.memberJoined, member: `<img src=x onerror="alert(1)">` },
      "en",
      settings,
    );

    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&lt;img");
  });

  it("leaves the button out when there is no app link", () => {
    const withLink = render("memberJoined");
    const withoutLink = render("memberJoined", "en", { ...settings, appUrl: null });

    expect(withLink.html).toContain("https://example.com");
    expect(withoutLink.html).not.toContain("https://example.com");
    expect(withoutLink.text).not.toContain("Open Kilist");
  });

  it("only mentions the household's foods for its last member", () => {
    const line = en.accountDeleted.lastInHousehold;

    expect(render("accountDeleted").text).toContain(line);
    expect(
      renderEmail("accountDeleted", { ...PREVIEWS.accountDeleted, lastInHousehold: false }, "en", settings).text,
    ).not.toContain(line);
  });

  it("dresses every other email in Calm", () => {
    for (const id of IDS.filter((id) => id !== "skinUnlock")) {
      expect(render(id).html).toContain("background:#F6F4EF");
    }
  });

  it("dresses the skin unlock in the unlocked skin", () => {
    const versus = render("skinUnlock");
    const roast = renderEmail("skinUnlock", { ...PREVIEWS.skinUnlock, skin: "roast" }, "en", settings);

    expect(versus.html).toContain("#16122E");
    expect(roast.html).toContain("#D7FF3E");
    expect(roast.subject).toBe(en.skinUnlock.roast.subject);
  });

  it("always offers to unsubscribe from release updates", () => {
    const email = render("releaseUpdate");

    expect(email.html).toContain(PREVIEWS.releaseUpdate.unsubscribeUrl);
    expect(email.text).toContain(PREVIEWS.releaseUpdate.unsubscribeUrl);
  });
});

describe("picking the language", () => {
  it("prefers the saved choice, then the device, then English", () => {
    expect(emailLang({ language: "fr", deviceLanguage: "en" })).toBe("fr");
    expect(emailLang({ language: null, deviceLanguage: "fr" })).toBe("fr");
    expect(emailLang({ language: null, deviceLanguage: null })).toBe("en");
  });
});

describe("previews", () => {
  const respond = () => {
    const out = { body: "" };
    const res = {
      status: () => res,
      type: () => res,
      send: (value: string) => {
        out.body = value;
        return res;
      },
    } as unknown as Response;
    return { out, res };
  };

  it("lists every email in every language", async () => {
    const { out, res } = respond();

    await browseEmailPreviews({} as Request, res);

    for (const id of IDS) {
      expect(out.body).toContain(`/emails/preview/${id}?lang=fr`);
    }
    expect(out.body).toContain("skin=roast");
  });

  it("shows the requested email, language and skin", async () => {
    const { out, res } = respond();

    await readEmailPreview(
      { params: { id: "skinUnlock" }, query: { lang: "fr", skin: "roast" } } as unknown as Request,
      res,
    );

    expect(out.body).toContain(fr.skinUnlock.roast.button);
  });

  it("can show the plain-text version", async () => {
    const { out, res } = respond();

    await readEmailPreview(
      { params: { id: "passwordReset" }, query: { format: "text" } } as unknown as Request,
      res,
    );

    expect(out.body).toContain("Subject: Your Kilist reset code: 482917");
    expect(out.body).not.toContain("<html");
  });

  it("refuses an unknown email", async () => {
    const { res } = respond();

    await expect(
      readEmailPreview({ params: { id: "nope" }, query: {} } as unknown as Request, res),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("sending", () => {
  const sendMail = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    clearEnv();
    sendMail.mockClear();
    vi.spyOn(nodemailer, "createTransport").mockReturnValue({ sendMail } as never);
  });

  afterEach(() => {
    clearEnv();
    vi.restoreAllMocks();
  });

  it("sends nothing and doesn't fail when SMTP isn't configured", async () => {
    const result = await sendEmail("camille@example.com", "passwordReset", PREVIEWS.passwordReset, "en");

    expect(result).toEqual({ sent: false });
    expect(sendMail).not.toHaveBeenCalled();
    expect(await EmailLogRepository.find()).toMatchObject([
      { recipient: "camille@example.com", emailId: "passwordReset", lang: "en", status: "not_configured" },
    ]);
  });

  it("sends the rendered email once SMTP is configured", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASSWORD = "secret";
    process.env.EMAIL_FROM = "Kilist <hello@example.com>";

    const result = await sendEmail("camille@example.com", "passwordReset", PREVIEWS.passwordReset, "fr");

    expect(result).toEqual({ sent: true });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.example.com", port: 587, secure: false }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Kilist <hello@example.com>",
        to: "camille@example.com",
        subject: "Ton code Kilist : 482917",
      }),
    );
    expect(await EmailLogRepository.find()).toMatchObject([{ status: "sent", lang: "fr", error: null }]);
  });

  it("never stores the code in the history", async () => {
    await sendEmail("camille@example.com", "passwordReset", PREVIEWS.passwordReset, "en");

    expect(JSON.stringify(await EmailLogRepository.find())).not.toContain(PREVIEWS.passwordReset.code);
  });

  it("lets the caller handle a provider failure", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASSWORD = "secret";
    process.env.EMAIL_FROM = "hello@example.com";
    sendMail.mockRejectedValueOnce(new Error("refused"));

    await expect(
      sendEmail("camille@example.com", "passwordReset", PREVIEWS.passwordReset, "en"),
    ).rejects.toThrow("refused");
    expect(await EmailLogRepository.find()).toMatchObject([{ status: "failed", error: "refused" }]);
  });
});
