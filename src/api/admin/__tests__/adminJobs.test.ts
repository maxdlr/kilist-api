import createFood from "@/api/foods/services/createFood";
import createHousehold from "@/api/households/services/createHousehold";
import createUser from "@/api/users/services/createUser";
import FoodRepository from "@/repositories/FoodRepository";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import ListRepository from "@/repositories/ListRepository";
import adminRoutes from "@/api/admin/routes/index";
import UserEntity, { DEFAULT_SKIN } from "@/entities/UserEntity";
import AdminJobRunRepository from "@/repositories/AdminJobRunRepository";
import UserRepository from "@/repositories/UserRepository";
import serviceErrorHandler from "@/services/serviceErrorHandlers";
import wrapRoutesHandlers from "@/services/wrapRoutesHandlers";
import express from "express";
import jwt from "jsonwebtoken";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import runAdminJob from "../services/jobs/runAdminJob";

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
  admin = await makeUser("boss", DEFAULT_SKIN);
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

    expect(await skinOf(user)).toBe(DEFAULT_SKIN);
  });

  it("deletes households with no member and their foods", async () => {
    const user = await makeUser("rosie", "roast");
    const empty = await createHousehold("Nobody home");
    const emptyList = await ListRepository.findOneByOrFail({ household: { id: empty.id } });
    await createFood(empty.id, emptyList.id, { name: "Ghost bread" });

    const dry = await runAdminJob("delete-orphans", true, admin.id);
    expect(dry).toMatchObject({ affected: 2, dryRun: true });
    expect(await HouseholdRepository.countBy({ id: empty.id })).toBe(1);

    await runAdminJob("delete-orphans", false, admin.id);

    expect(await HouseholdRepository.countBy({ id: empty.id })).toBe(0);
    expect(await FoodRepository.countBy({ name: "Ghost bread" })).toBe(0);
    expect(await FoodRepository.count({ where: { name: "Ghost bread" }, withDeleted: true })).toBe(1);
    expect(await HouseholdRepository.count({ where: { id: empty.id }, withDeleted: true })).toBe(1);
    expect(await runAdminJob("delete-orphans", true, admin.id)).toMatchObject({ affected: 0 });
    expect(await HouseholdRepository.countBy({ id: user.household.id })).toBe(1);
    expect(await HouseholdRepository.countBy({ id: admin.household.id })).toBe(1);
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
