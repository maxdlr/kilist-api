import forgotPassword from "@/api/auth/controllers/forgotPassword";
import resetPassword from "@/api/auth/controllers/resetPassword";
import confirmEmail from "@/api/auth/controllers/confirmEmail";
import readCatalog from "@/api/catalog/controllers/readCatalog";
import createUser from "@/api/users/services/createUser";
import createVerificationCode from "@/api/verification/services/createVerificationCode";
import EmailLogEntity from "@/entities/EmailLogEntity";
import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import UserEntity from "@/entities/UserEntity";
import VerificationCodeEntity from "@/entities/VerificationCodeEntity";
import { AppDataSource } from "@/services/database/datasource";
import doTransaction from "@/utils/doTransaction";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import applyOp from "@/api/sync/services/applyOp";
import notifyHousehold from "../services/notifyHousehold";
import notifyUser from "../services/notifyUser";

let user: UserEntity;
const res = () => {
  const r: any = { code: 0, body: undefined };
  r.status = (code: number) => ((r.code = code), r);
  r.end = () => r;
  r.send = (body: unknown) => ((r.body = body), r);
  r.json = (body: unknown) => ((r.body = body), r);
  return r as Response & { code: number; body: any };
};
const logs = () => AppDataSource.manager.find(EmailLogEntity, { order: { id: "ASC" } });
const reload = () =>
  AppDataSource.manager.findOneOrFail(UserEntity, { where: { id: user.id }, select: { id: true, _password: true, emailConfirmedAt: true, notifications: true } as any });

beforeEach(async () => {
  user = await createUser({
    username: "notified",
    email: "notified@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
});

describe("password reset", () => {
  it("answers the same for an unknown email and sends nothing", async () => {
    const r = res();
    await forgotPassword({ body: { email: "nobody@example.com" } } as Request, r);
    expect(r.code).toBe(202);
    expect(await logs()).toHaveLength(0);
  });

  it("always emails a code, even if the user turned emails off", async () => {
    await doTransaction((m) => m.update(UserEntity, user.id, { notifications: { memberJoined: "none" } }));
    await forgotPassword({ body: { email: "notified@example.com" } } as Request, res());

    expect((await logs()).map((log) => log.emailId)).toEqual(["passwordReset"]);
    expect(await AppDataSource.manager.count(VerificationCodeEntity)).toBe(1);
  });

  it("changes the password with the right code and signs out other sessions", async () => {
    await AppDataSource.manager.save(RefreshTokenEntity, { token: "t", expireOn: new Date(Date.now() + 1e7), userId: user.id });
    const { code } = await createVerificationCode(user.id, "reset");

    await resetPassword({ body: { email: user.email, code, password: "N3w!Passw0rd" } } as Request, res());

    expect(bcrypt.compareSync("N3w!Passw0rd", (await reload() as any)._password)).toBe(true);
    const token = await AppDataSource.manager.findOneByOrFail(RefreshTokenEntity, { userId: user.id });
    expect(token.revokedOn).toBeTruthy();
    await expect(
      resetPassword({ body: { email: user.email, code, password: "An0ther!Pass" } } as Request, res()),
    ).rejects.toMatchObject({ code: "code.invalid" });
  });

  it("locks a code after five wrong tries", async () => {
    const { code } = await createVerificationCode(user.id, "reset");
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 4; i += 1) {
      await expect(resetPassword({ body: { email: user.email, code: wrong, password: "N3w!Passw0rd" } } as Request, res())).rejects.toMatchObject({ code: "code.invalid" });
    }
    await expect(resetPassword({ body: { email: user.email, code: wrong, password: "N3w!Passw0rd" } } as Request, res())).rejects.toMatchObject({ code: "code.tooManyAttempts" });
    await expect(resetPassword({ body: { email: user.email, code, password: "N3w!Passw0rd" } } as Request, res())).rejects.toMatchObject({ code: "code.tooManyAttempts" });
  });

  it("refuses an expired code and a weak password", async () => {
    const { code } = await createVerificationCode(user.id, "reset");
    await expect(resetPassword({ body: { email: user.email, code, password: "weak" } } as Request, res())).rejects.toMatchObject({ status: 400 });
    await AppDataSource.manager.update(VerificationCodeEntity, { purpose: "reset" }, { expiresAt: new Date(Date.now() - 1000) });
    await expect(resetPassword({ body: { email: user.email, code, password: "N3w!Passw0rd" } } as Request, res())).rejects.toMatchObject({ code: "code.expired" });
  });

  it("stores codes hashed, never in clear", async () => {
    const { code } = await createVerificationCode(user.id, "reset");
    const row = await AppDataSource.manager.findOneByOrFail(VerificationCodeEntity, {});
    expect(row.codeHash).not.toContain(code);
  });
});

describe("email confirmation", () => {
  it("marks the email as confirmed with the right code", async () => {
    const { code } = await createVerificationCode(user.id, "confirm");
    await confirmEmail({ body: { code }, user } as unknown as Request, res());
    expect((await reload()).emailConfirmedAt).toBeTruthy();
  });

  it("only accepts the latest code", async () => {
    const first = await createVerificationCode(user.id, "confirm");
    await createVerificationCode(user.id, "confirm");
    await expect(confirmEmail({ body: { code: first.code }, user } as unknown as Request, res())).rejects.toMatchObject({ status: 400 });
  });
});

describe("notification choices", () => {
  const vars = { name: "n", email: "notified@example.com", member: "Sam", household: "Home", players: 2 };

  it("defaults to push only for optional events", async () => {
    expect(await notifyUser(user, "memberJoined", vars)).toBe("push");
    expect(await logs()).toHaveLength(0);
  });

  it("emails when the user chose email or both", async () => {
    expect(await notifyUser({ ...user, notifications: { memberJoined: "both" } }, "memberJoined", vars)).toBe("both");
    expect((await logs()).map((log) => log.emailId)).toEqual(["memberJoined"]);
  });

  it("saves a valid choice and rejects one the event can't use", async () => {
    await doTransaction((m) => applyOp(user, { id: "1", type: "me.notifications", at: "", payload: { event: "memberLeft", choice: "email" } }, new Date(), {}, m));
    expect((await reload()).notifications).toEqual({ memberLeft: "email" });
    await expect(
      doTransaction((m) => applyOp(user, { id: "2", type: "me.notifications", at: "", payload: { event: "dailyReminder", choice: "email" } }, new Date(), {}, m)),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("tells other members, not the one who joined", async () => {
    const mate = await createUser({
      username: "mate",
      email: "mate@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "join",
      joinCode: user.household.joinCode,
    });
    await AppDataSource.manager.update(UserEntity, user.id, { notifications: { memberJoined: "email" } });

    expect(await notifyHousehold("memberJoined", user.household.id, mate)).toBe(1);
    const sent = await logs();
    expect(sent.map((log) => log.recipient)).toEqual(["notified@example.com"]);
  });

  it("publishes the events in the catalogue with marketing opt-in for accounts only", () => {
    const r = res();
    readCatalog({} as Request, r);
    const news = r.body.notifications.events.find((event: any) => event.id === "productNews");
    expect(news).toMatchObject({ default: "none", guestDefault: "push" });
    expect(r.body.notifications.events.find((event: any) => event.id === "dailyReminder").channels).toEqual(["push"]);
  });
});

describe("guest choices at signup", () => {
  it("keeps push and none choices, never turns an email on", async () => {
    const { default: importGuestData } = await import("@/api/sync/services/importGuestData");
    await doTransaction((m) =>
      importGuestData(user, { importId: "g1", foods: [], notifications: { productNews: "push", memberJoined: "none", skinUnlock: "email", fake: "push" } } as any, m, { withPreferences: true }),
    );
    expect((await reload()).notifications).toEqual({ productNews: "push", memberJoined: "none" });
  });
});
