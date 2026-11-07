import createUser from "@/api/users/services/createUser";
import adminRoutes from "@/api/admin/routes/index";
import UserEntity from "@/entities/UserEntity";
import AdminJobRunRepository from "@/repositories/AdminJobRunRepository";
import UserRepository from "@/repositories/UserRepository";
import serviceErrorHandler from "@/services/serviceErrorHandlers";
import wrapRoutesHandlers from "@/services/wrapRoutesHandlers";
import express from "express";
import jwt from "jsonwebtoken";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import runAdminJob from "../services/runAdminJob";
import { AppDataSource } from "@/services/database/datasource";
import UnlockEntity from "@/entities/UnlockEntity";

let admin: UserEntity;
let server: Server;
let baseUrl: string;

const makeUser = async (name: string, skin: string) => {
  const user = await createUser({
    username: name,
    email: `${name}@example.com`,
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  await UserRepository.update(user.id, { skin });
  return user;
};

const skinOf = async (user: UserEntity) =>
  (await UserRepository.findOneByOrFail({ id: user.id })).skin;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const id = req.headers["x-test-user"];
    req.signedCookies = id
      ? { auth: jwt.sign({ id: Number(id) }, process.env.JWT_SECRET!) }
      : {};
    next();
  });
  wrapRoutesHandlers(adminRoutes);
  app.use("/admin", adminRoutes);
  app.use(serviceErrorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

beforeEach(async () => {
  admin = await makeUser("boss", "arcade");
  await UserRepository.update(admin.id, { type: "admin" });
});

describe("admin jobs", () => {
  it("dry runs change nothing but report the count", async () => {
    const user = await makeUser("rosie", "roast");

    const result = await runAdminJob("switch-to-default-skin", true, admin.id);

    expect(result).toMatchObject({ affected: 1, dryRun: true });
    expect(await skinOf(user)).toBe("roast");
  });

  it("switches everyone to the default skin", async () => {
    const user = await makeUser("rosie", "roast");

    await runAdminJob("switch-to-default-skin", false, admin.id);

    expect(await skinOf(user)).toBe("arcade");
  });

  it("logs every run", async () => {
    await runAdminJob("switch-to-default-skin", true, admin.id);

    expect(
      await AdminJobRunRepository.count({ where: { jobId: "switch-to-default-skin" } }),
    ).toBe(1);
  });

  it("refuses an unknown job", async () => {
    await expect(runAdminJob("nope", true, admin.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("keeps the endpoints admin-only", async () => {
    const regular = await makeUser("regular", "arcade");
    const asRegular = await fetch(`${baseUrl}/admin/jobs`, {
      headers: { "x-test-user": String(regular.id) },
    });
    const asAdmin = await fetch(`${baseUrl}/admin/jobs`, {
      headers: { "x-test-user": String(admin.id) },
    });

    expect(asRegular.status).toBe(403);
    expect(asAdmin.status).toBe(200);
    expect((await asAdmin.json()).map((job: { id: string }) => job.id)).toContain(
      "switch-to-default-skin",
    );
  });

  it("defaults to a dry run unless told otherwise", async () => {
    const user = await makeUser("rosie", "roast");
    const res = await fetch(`${baseUrl}/admin/jobs/switch-to-default-skin/run`, {
      method: "POST",
      headers: { "x-test-user": String(admin.id), "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect((await res.json()).dryRun).toBe(true);
    expect(await skinOf(user)).toBe("roast");
  });
});

describe("gift a skin", () => {
  const owns = async (user: UserEntity, prizeId: string) =>
    (await AppDataSource.manager.count(UnlockEntity, { where: { user: { id: user.id }, prizeId } })) > 0;

  it("previews the gift without giving it", async () => {
    const user = await makeUser("gifted", "arcade");

    const result = await runAdminJob("gift-skin", true, admin.id, { prizeId: "skin:roast", email: "GIFTED@example.com" });

    expect(result).toMatchObject({ affected: 1, summary: "gifted (gifted@example.com) would get Roast." });
    expect(await owns(user, "skin:roast")).toBe(false);
  });

  it("unlocks the skin for that user only", async () => {
    const user = await makeUser("gifted", "arcade");
    const other = await makeUser("other", "arcade");

    await runAdminJob("gift-skin", false, admin.id, { prizeId: "skin:versus", email: "gifted@example.com" });

    expect(await owns(user, "skin:versus")).toBe(true);
    expect(await owns(other, "skin:versus")).toBe(false);
  });

  it("says so when the user already has it", async () => {
    await makeUser("gifted", "arcade");
    await runAdminJob("gift-skin", false, admin.id, { prizeId: "skin:roast", email: "gifted@example.com" });

    const again = await runAdminJob("gift-skin", false, admin.id, { prizeId: "skin:roast", email: "gifted@example.com" });

    expect(again).toMatchObject({ affected: 0, summary: "gifted (gifted@example.com) already has Roast." });
  });

  it("reports an unknown email or a missing skin instead of failing", async () => {
    expect(await runAdminJob("gift-skin", false, admin.id, { prizeId: "skin:roast", email: "nobody@example.com" }))
      .toMatchObject({ affected: 0, summary: "No account uses nobody@example.com." });
    expect(await runAdminJob("gift-skin", false, admin.id, { prizeId: "skin:arcade", email: "boss@example.com" }))
      .toMatchObject({ affected: 0, summary: "Pick a skin to give." });
  });

  it("lists its fields and takes them over HTTP", async () => {
    const user = await makeUser("gifted", "arcade");
    const list = await (await fetch(`${baseUrl}/admin/jobs`, { headers: { "x-test-user": String(admin.id) } })).json();
    const gift = list.find((job: { id: string }) => job.id === "gift-skin");

    expect(gift.fields.map((field: { name: string }) => field.name)).toEqual(["prizeId", "email"]);
    expect(gift.fields[0].options.map((option: { value: string }) => option.value)).toEqual(["skin:roast", "skin:versus"]);

    await fetch(`${baseUrl}/admin/jobs/gift-skin/run`, {
      method: "POST",
      headers: { "x-test-user": String(admin.id), "content-type": "application/json" },
      body: JSON.stringify({ dryRun: false, input: { prizeId: "skin:roast", email: "gifted@example.com" } }),
    });

    expect(await owns(user, "skin:roast")).toBe(true);
  });
});
