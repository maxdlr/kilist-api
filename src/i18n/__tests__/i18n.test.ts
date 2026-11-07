import serviceErrorHandler from "@/services/serviceErrorHandlers";
import { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { langOf, parseAcceptLanguage } from "..";

const respond = (err: unknown, headers: Record<string, string> = {}, user?: object) => {
  const out: { status?: number; body?: any } = {};
  const res = {
    status: (code: number) => {
      out.status = code;
      return res;
    },
    send: (value: unknown) => {
      out.body = value;
      return res;
    },
  } as unknown as Response;
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  serviceErrorHandler(err as Error, { headers, user, method: "GET", originalUrl: "/x" } as unknown as Request, res, () => undefined);
  return out;
};

describe("picking the language", () => {
  it("reads the first supported Accept-Language", () => {
    expect(parseAcceptLanguage("de-DE, fr-FR;q=0.9, en;q=0.8")).toBe("fr");
    expect(parseAcceptLanguage("de")).toBeUndefined();
  });

  it("prefers the header, then the saved choice, then English", () => {
    const user = { language: "fr" } as never;
    expect(langOf({ headers: { "accept-language": "en" }, user })).toBe("en");
    expect(langOf({ headers: {}, user })).toBe("fr");
    expect(langOf({ headers: {} })).toBe("en");
  });
});

describe("translating errors", () => {
  it("translates a coded error", () => {
    const out = respond(UserError(402, "prizes.notEnough"), { "accept-language": "fr" });
    expect(out.status).toBe(402);
    expect(out.body.code).toBe("prizes.notEnough");
    expect(out.body.message).toBe("Pas encore assez de points.");
  });

  it("translates validation messages and leads with the first one", () => {
    const out = respond(
      BadValidation([{ property: "password", messages: ["validation.password.weak"] }]),
      { "accept-language": "fr" },
    );
    expect(out.body.message).toMatch(/^Ton mot de passe/);
    expect(out.body.errors[0].messages[0]).toBe(out.body.message);
  });

  it("hides developer errors behind a translated generic message", () => {
    const out = respond(ApiError("ShopList id is required"), { "accept-language": "fr" });
    expect(out.body.message).toBe("Un problème est survenu. Réessaie.");
    expect(out.body.error.detail).toBe("ShopList id is required");
  });
});
