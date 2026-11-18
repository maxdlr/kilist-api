import addAdminNews from "@/api/admin/services/news/addAdminNews";
import cancelAdminNews from "@/api/admin/services/news/cancelAdminNews";
import editAdminNews from "@/api/admin/services/news/editAdminNews";
import readAdminNews from "@/api/admin/services/news/readAdminNews";
import postNewsEvent from "../controllers/postNewsEvent";
import testAdminNews from "@/api/admin/services/news/testAdminNews";
import postDevicePushToken from "@/api/push/controllers/postDevicePushToken";
import postPushToken from "@/api/push/controllers/postPushToken";
import createUser from "@/api/users/services/createUser";
import NewsEntity from "@/entities/NewsEntity";
import PushTokenEntity from "@/entities/PushTokenEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import dispatchDueNews from "../services/dispatchDueNews";
import findCurrentNews from "../services/findCurrentNews";

const USER_TOKEN = "ExponentPushToken[userphone0000001]";
const GUEST_EN = "ExponentPushToken[guestphone000001]";
const GUEST_FR = "ExponentPushToken[guestphone000002]";
const GUEST_OFF = "ExponentPushToken[guestphone000003]";
const INSTALL = "0f8e2a4c-1b3d-4e5f-9a7b-6c5d4e3f2a1b";

const m = () => AppDataSource.manager;
const res = () => {
  const r: any = {};
  r.status = (code: number) => ((r.code = code), r);
  r.end = () => r;
  return r as Response;
};
const device = (token: string, extra: Record<string, unknown> = {}) =>
  postDevicePushToken({ body: { installId: INSTALL, token, platform: "ios", lang: "en", ...extra } } as Request, res());

const mockExpo = () => {
  const fetchMock = vi.fn(async (_url: string, init: { body: string }) => ({
    ok: true,
    status: 200,
    json: async () => ({ data: JSON.parse(init.body).map(() => ({ status: "ok" })) }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};
const sentTo = (fetchMock: ReturnType<typeof mockExpo>) =>
  fetchMock.mock.calls.flatMap((call) => JSON.parse((call as any)[1].body)) as { to: string; title: string; body: string; data: { url: string } }[];

const draft = (extra: Record<string, unknown> = {}) => ({
  titleEn: "New look",
  bodyEn: "Pick your own colors.",
  titleFr: "Nouveau look",
  bodyFr: "Choisis tes couleurs.",
  url: "/account?panel=theme",
  sendAt: new Date(Date.now() - 1000).toISOString(),
  ...extra,
});

let admin: UserEntity;
let reader: UserEntity;
let quiet: UserEntity;

beforeEach(async () => {
  admin = await createUser({ username: "boss", email: "boss@example.com", password: "Str0ng!Passw0rd", householdChoice: "create" });
  reader = await createUser({ username: "reader", email: "reader@example.com", password: "Str0ng!Passw0rd", householdChoice: "create" });
  quiet = await createUser({ username: "quiet", email: "quiet@example.com", password: "Str0ng!Passw0rd", householdChoice: "create" });
  await m().update(UserEntity, reader.id, { notifications: { productNews: "push" } });
});
afterEach(() => vi.unstubAllGlobals());

describe("guest devices", () => {
  it("saves a guest token and hands it to whoever signs in on that phone", async () => {
    await device(GUEST_EN);
    let saved = await m().find(PushTokenEntity, { relations: ["user"] });
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ installId: INSTALL, lang: "en", news: true, user: null });

    await postPushToken({ body: { token: GUEST_EN }, user: reader } as Request, res());
    saved = await m().find(PushTokenEntity, { relations: ["user"] });
    expect(saved).toHaveLength(1);
    expect(saved[0]!.user!.id).toBe(reader.id);
  });

  it("refuses a bad install id", async () => {
    await expect(device(GUEST_EN, { installId: "x" })).rejects.toMatchObject({ status: 400 });
  });
});

describe("sending news", () => {
  beforeEach(async () => {
    await postPushToken({ body: { token: USER_TOKEN }, user: reader } as Request, res());
    await postPushToken({ body: { token: "ExponentPushToken[quietphone000001]" }, user: quiet } as Request, res());
    await device(GUEST_EN);
    await device(GUEST_FR, { installId: "1f8e2a4c-1b3d-4e5f-9a7b-6c5d4e3f2a1b", lang: "fr" });
    await device(GUEST_OFF, { installId: "2f8e2a4c-1b3d-4e5f-9a7b-6c5d4e3f2a1b", news: false });
  });

  it("pushes due news to opted-in users and guests, each in their language", async () => {
    const fetchMock = mockExpo();
    await addAdminNews(admin, draft());

    expect(await dispatchDueNews()).toBe(1);

    const sent = sentTo(fetchMock);
    expect(sent.map((message) => message.to).sort()).toEqual([USER_TOKEN, GUEST_EN, GUEST_FR].sort());
    expect(sent.find((message) => message.to === GUEST_FR)).toMatchObject({ title: "Nouveau look", data: { url: "/account?panel=theme" } });
    expect(sent.find((message) => message.to === GUEST_EN)).toMatchObject({ title: "New look" });
    const news = await m().findOneByOrFail(NewsEntity, {});
    expect(news).toMatchObject({ status: "sent", delivered: 3, failed: 0 });
  });

  it("sends English-only news to English phones only", async () => {
    const fetchMock = mockExpo();
    await addAdminNews(admin, draft({ titleFr: "", bodyFr: "" }));
    await dispatchDueNews();
    expect(sentTo(fetchMock).map((message) => message.to).sort()).toEqual([USER_TOKEN, GUEST_EN].sort());
  });

  it("sends French-only news to French phones only", async () => {
    const fetchMock = mockExpo();
    await addAdminNews(admin, draft({ titleEn: "", bodyEn: "" }));
    await dispatchDueNews();
    expect(sentTo(fetchMock)).toEqual([expect.objectContaining({ to: GUEST_FR, title: "Nouveau look" })]);
  });

  it("refuses to schedule a news with no language, or half a language", async () => {
    expect(() => addAdminNews(admin, draft({ titleEn: "", bodyEn: "", titleFr: "", bodyFr: "" }))).toThrow(
      /at least one language/,
    );
    expect(() => addAdminNews(admin, draft({ bodyFr: "" }))).toThrow(/French/);
  });

  it("sends each news once, and never early or after a cancel", async () => {
    const fetchMock = mockExpo();
    await addAdminNews(admin, draft({ sendAt: new Date(Date.now() + 3600000).toISOString() }));
    const cancelled = await addAdminNews(admin, draft());
    await cancelAdminNews(admin, cancelled.id);
    expect(await dispatchDueNews()).toBe(0);

    await addAdminNews(admin, draft());
    await dispatchDueNews();
    await dispatchDueNews();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts app routes and web links, nothing else", async () => {
    const web = await addAdminNews(admin, draft({ url: "https://kilist.app/blog?x=1" }));
    expect(web.url).toBe("https://kilist.app/blog?x=1");
    expect(() => addAdminNews(admin, draft({ url: "//evil.example" }))).toThrow();
    expect(() => addAdminNews(admin, draft({ url: "javascript:alert(1)" }))).toThrow();
    expect(() => addAdminNews(admin, draft({ url: "ftp://files.example" }))).toThrow();
    expect(() => addAdminNews(admin, draft({ url: "https://nodot" }))).toThrow();
  });

  it("test-sends each written language only to the admin's own phones", async () => {
    const fetchMock = mockExpo();
    const adminToken = "ExponentPushToken[adminphone000001]";
    await postPushToken({ body: { token: adminToken }, user: admin } as Request, res());
    await testAdminNews(admin, draft());
    const sent = sentTo(fetchMock);
    expect(sent.map((message) => message.to)).toEqual([adminToken, adminToken]);
    expect(sent.map((message) => message.title).sort()).toEqual(["New look", "Nouveau look"]);
    expect(await m().count(NewsEntity)).toBe(0);
  });
});

describe("news card feed", () => {
  it("lists news that are due, recent and not cancelled, in the reader's language", async () => {
    const old = new Date(Date.now() - 40 * 24 * 3600000).toISOString();
    await addAdminNews(admin, draft({ titleEn: "Old", sendAt: old }));
    await addAdminNews(admin, draft({ titleEn: "Later", sendAt: new Date(Date.now() + 3600000).toISOString() }));
    const gone = await addAdminNews(admin, draft({ titleEn: "Gone" }));
    await cancelAdminNews(admin, gone.id);
    await addAdminNews(admin, draft());

    const fr = await findCurrentNews("fr");
    expect(fr).toHaveLength(1);
    expect(fr[0]).toMatchObject({ title: "Nouveau look", body: "Choisis tes couleurs.", url: "/account?panel=theme" });
    expect((await findCurrentNews("en"))[0]).toMatchObject({ title: "New look" });
  });

  it("only shows a news to readers of a language it was written in", async () => {
    await addAdminNews(admin, draft({ titleEn: "", bodyEn: "" }));
    expect(await findCurrentNews("en")).toHaveLength(0);
    expect(await findCurrentNews("fr")).toHaveLength(1);
  });
});

describe("drafts and edits", () => {
  it("keeps drafts off the push and off Home, even once their date passes", async () => {
    const fetchMock = mockExpo();
    await postPushToken({ body: { token: USER_TOKEN }, user: reader } as Request, res());
    const news = await addAdminNews(admin, { titleEn: "Half done", draft: true });

    expect(news.status).toBe("draft");
    expect(await dispatchDueNews()).toBe(0);
    expect(await findCurrentNews("en")).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("needs the full text and a date only once it is scheduled", async () => {
    const news = await addAdminNews(admin, { titleEn: "Half done", draft: true });
    expect(() => editAdminNews(admin, news.id, { titleEn: "Half done" })).toThrow();

    const scheduled = await editAdminNews(admin, news.id, draft({ titleEn: "Done" }));
    expect(scheduled).toMatchObject({ status: "scheduled", titleEn: "Done", url: "/account?panel=theme" });
  });

  it("edits a scheduled news, can turn it back into a draft, and sends the latest text", async () => {
    const fetchMock = mockExpo();
    await postPushToken({ body: { token: USER_TOKEN }, user: reader } as Request, res());
    const news = await addAdminNews(admin, draft({ sendAt: new Date(Date.now() + 3600000).toISOString() }));

    const back = await editAdminNews(admin, news.id, { ...draft(), draft: true });
    expect(back.status).toBe("draft");

    await editAdminNews(admin, news.id, draft({ titleEn: "Fresh title", url: null }));
    await dispatchDueNews();
    expect(sentTo(fetchMock)[0]).toMatchObject({ title: "Fresh title", data: { url: "/" } });
  });

  it("refuses to edit a news that already went out", async () => {
    mockExpo();
    const news = await addAdminNews(admin, draft());
    await dispatchDueNews();
    await expect(editAdminNews(admin, news.id, draft({ titleEn: "Too late" }))).rejects.toMatchObject({ status: 400 });
  });
});

describe("engagement", () => {
  const event = (id: number, kind: string, installId = INSTALL) =>
    postNewsEvent({ params: { id: String(id) }, body: { installId, kind } } as unknown as Request, res());

  it("tags the push with the news id so the phone can report the open", async () => {
    const fetchMock = mockExpo();
    await device(GUEST_EN);
    const news = await addAdminNews(admin, draft());
    await dispatchDueNews();
    expect(sentTo(fetchMock)[0]!.data).toMatchObject({ newsId: news.id, url: "/account?panel=theme" });
  });

  it("counts each phone once per kind, and openers across push and card", async () => {
    mockExpo();
    const news = await addAdminNews(admin, draft());
    await dispatchDueNews();
    const other = "1f8e2a4c-1b3d-4e5f-9a7b-6c5d4e3f2a1b";
    const third = "2f8e2a4c-1b3d-4e5f-9a7b-6c5d4e3f2a1b";

    await event(news.id, "push_open");
    await event(news.id, "push_open");
    await event(news.id, "card_open");
    await event(news.id, "card_open", other);
    await event(news.id, "card_close", third);

    expect((await readAdminNews(news.id)).engagement).toEqual({ opened: 2, pushOpens: 1, cardOpens: 2, closed: 1 });
  });

  it("ignores reports for drafts and refuses junk", async () => {
    const news = await addAdminNews(admin, { titleEn: "Draft", draft: true });
    await expect(event(news.id, "card_open")).rejects.toMatchObject({ status: 404 });
    await expect(event(news.id, "liked")).rejects.toMatchObject({ status: 400 });
    await expect(event(news.id, "card_open", "nope")).rejects.toMatchObject({ status: 400 });
  });
});
