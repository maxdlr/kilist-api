import adminRoutes from "@/api/admin/routes/index";
import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import updateFoodInStockScore from "@/api/foods/services/updateFoodInStockScore";
import createUser from "@/api/users/services/createUser";
import AdminActionEntity from "@/entities/AdminActionEntity";
import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import serviceErrorHandler from "@/services/serviceErrorHandlers";
import wrapRoutesHandlers from "@/services/wrapRoutesHandlers";
import express from "express";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import type { AddressInfo } from "net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

let server: Server;
let baseUrl: string;
let admin: UserEntity;
let camille: UserEntity;

const m = () => AppDataSource.manager;

const makeUser = (name: string, extra: Record<string, string> = {}) =>
  createUser({
    username: name,
    email: `${name}@example.com`,
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
    ...extra,
  } as Parameters<typeof createUser>[0]);

const call = async (method: string, path: string, body?: unknown, as: UserEntity = admin) => {
  const res = await fetch(`${baseUrl}/admin${path}`, {
    method,
    headers: { "x-test-user": String(as.id), "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const fresh = async (user: UserEntity) =>
  m().findOneOrFail(UserEntity, { where: { id: user.id }, relations: { household: true } });

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const id = req.headers["x-test-user"];
    req.signedCookies = id ? { auth: jwt.sign({ id: Number(id) }, process.env.JWT_SECRET!) } : {};
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
  admin = await makeUser("boss");
  await m().update(UserEntity, admin.id, { type: "admin" });
  camille = await makeUser("camille");
});

describe("admin users", () => {
  it("stays admin-only", async () => {
    expect((await call("GET", "/users", undefined, camille)).status).toBe(403);
  });

  it("searches and reads a user", async () => {
    const list = await call("GET", "/users?search=cami");
    expect(list.body.items.map((user: { username: string }) => user.username)).toEqual(["camille"]);

    const detail = await call("GET", `/users/${camille.id}`);
    expect(detail.body).toMatchObject({ username: "camille", stats: { points: 0 }, household: { members: 1 } });
    expect(detail.body.skins.find((skin: { skin: string }) => skin.skin === "roast").owned).toBe(false);
  });

  it("unlocks a skin as a gift and takes it back", async () => {
    await call("POST", `/users/${camille.id}/unlocks`, { prizeId: "skin:roast" });
    const unlock = await m().findOneByOrFail(UnlockEntity, { user: { id: camille.id }, prizeId: "skin:roast" });
    expect(unlock.source).toBe("gift");
    expect((await call("POST", `/users/${camille.id}/unlocks`, { prizeId: "skin:roast" })).status).toBe(409);

    await m().update(UserEntity, camille.id, { skin: "roast" });
    await call("DELETE", `/users/${camille.id}/unlocks/skin:roast`);
    expect((await fresh(camille)).skin).toBe("arcade");
  });

  it("gives points but never below zero", async () => {
    expect((await call("POST", `/users/${camille.id}/points`, { amount: 120, reason: "Beta tester" })).body.balance).toBe(120);
    expect((await call("POST", `/users/${camille.id}/points`, { amount: -500 })).status).toBe(400);
  });

  it("never lets you remove your own admin role", async () => {
    expect((await call("PUT", `/users/${admin.id}/admin`, { admin: false })).status).toBe(400);
    await call("PUT", `/users/${camille.id}/admin`, { admin: true });
    expect((await fresh(camille)).type).toBe("admin");
  });

  it("edits name, email and language", async () => {
    await call("PUT", `/users/${camille.id}`, { username: "cami", email: "CAMI@example.com", language: "fr" });
    expect(await fresh(camille)).toMatchObject({ username: "cami", email: "cami@example.com", language: "fr" });
  });

  it("moves a user by join code", async () => {
    const boss = await fresh(admin);
    await call("PUT", `/users/${camille.id}/household`, { joinCode: boss.household.joinCode });
    expect((await fresh(camille)).household.id).toBe(boss.household.id);
  });

  it("deletes a regular user but not an admin", async () => {
    const other = await makeUser("other");
    await m().update(UserEntity, other.id, { type: "admin" });
    expect((await call("DELETE", `/users/${other.id}`)).status).toBe(400);
    expect((await call("DELETE", `/users/${camille.id}`)).status).toBe(200);
    expect(await m().exists(UserEntity, { where: { id: camille.id } })).toBe(false);
  });

  it("remembers the phone language each request reports", async () => {
    await fetch(`${baseUrl}/admin/users`, { headers: { "x-test-user": String(admin.id), "x-device-language": "fr" } });
    expect((await fresh(admin)).deviceLanguage).toBe("fr");
    await fetch(`${baseUrl}/admin/users`, { headers: { "x-test-user": String(admin.id), "x-device-language": "de" } });
    expect((await fresh(admin)).deviceLanguage).toBe("fr");
  });

  it("logs every action", async () => {
    await call("POST", `/users/${camille.id}/points`, { amount: 10 });
    const log = await m().find(AdminActionEntity, { where: { targetType: "user", targetId: camille.id } });
    expect(log.map((entry) => entry.summary)).toEqual(["Gave 10 points to camille"]);
    expect((await call("GET", "/actions")).body[0].summary).toBe("Gave 10 points to camille");
  });
});

describe("admin households", () => {
  it("adds and removes members, keeping everyone in a household", async () => {
    const boss = await fresh(admin);
    await call("POST", `/households/${boss.household.id}/members`, { email: "CAMILLE@example.com" });
    expect((await fresh(camille)).household.id).toBe(boss.household.id);

    const removed = await call("DELETE", `/households/${boss.household.id}/members/${camille.id}`);
    const after = await fresh(camille);
    expect(after.household.id).toBe(removed.body.householdId);
    expect(after.household.id).not.toBe(boss.household.id);
  });

  it("only deletes an empty household", async () => {
    const own = (await fresh(camille)).household.id;
    expect((await call("DELETE", `/households/${own}`)).status).toBe(400);
    const created = await call("POST", "/households", { name: "Empty" });
    expect((await call("DELETE", `/households/${created.body.id}`)).status).toBe(200);
    expect(await m().exists(HouseholdEntity, { where: { id: created.body.id } })).toBe(false);
  });

  it("renames and changes the join code", async () => {
    const own = await fresh(camille);
    await call("PUT", `/households/${own.household.id}`, { name: "Chez Camille" });
    const code = await call("POST", `/households/${own.household.id}/join-code`);
    const home = await m().findOneByOrFail(HouseholdEntity, { id: own.household.id });
    expect(home).toMatchObject({ name: "Chez Camille", joinCode: code.body.joinCode });
    expect(code.body.joinCode).not.toBe(own.household.joinCode);
  });
});

describe("admin foods and lists", () => {
  const addFood = async (name: string) => {
    const own = await fresh(camille);
    const created = await call("POST", "/foods", { householdId: own.household.id, name });
    return m().findOneByOrFail(FoodEntity, { id: created.body.id });
  };

  it("creates a food on the main list with its icon", async () => {
    const food = await addFood("Beurre");
    expect(food.icon).toBe("cheese");
    const detail = await call("GET", `/foods/${food.id}`);
    expect(detail.body.lists.map((list: { isMain: boolean }) => list.isMain)).toEqual([true]);
  });

  it("resets a score and clears next time", async () => {
    const food = await addFood("Lait");
    await createFoodHistory({ foodId: food.id, isInStock: false, userId: camille.id });
    await updateFoodInStockScore(food.id);
    await m().update(FoodEntity, food.id, { snoozedUntil: new Date(Date.now() + 86400000) });

    await call("POST", `/foods/${food.id}/reset-score`);
    await call("POST", `/foods/${food.id}/unsnooze`);
    const after = await m().findOneByOrFail(FoodEntity, { id: food.id });
    expect(after.inStockScore).toBe(1);
    expect(after.snoozedUntil).toBeNull();
  });

  it("matches the icon again on rename, and in bulk", async () => {
    const food = await addFood("Mystery");
    expect(food.icon).toBeNull();
    await call("PUT", `/foods/${food.id}`, { name: "Pâtes" });
    expect((await m().findOneByOrFail(FoodEntity, { id: food.id })).icon).toBe("pasta");

    await m().update(FoodEntity, food.id, { icon: null });
    expect((await call("POST", "/foods/match-icons")).body.matched).toBeGreaterThanOrEqual(1);
  });

  it("filters foods by user or household and searches fuzzily", async () => {
    await addFood("Pineapple");
    await addFood("Apple");
    const other = await makeUser("other");
    await call("POST", "/foods", { householdId: (await fresh(other)).household.id, name: "Pine apple" });

    const all = await call("GET", `/foods?search=${encodeURIComponent("pine with apple")}`);
    expect(all.body.items.map((food: { name: string }) => food.name).sort()).toEqual(["Pine apple", "Pineapple"]);

    const mine = await call("GET", `/foods?userId=${camille.id}&search=pineapple`);
    expect(mine.body.items.map((food: { name: string }) => food.name)).toEqual(["Pineapple"]);
    expect(mine.body.scope.user.username).toBe("camille");
    expect(mine.body.items[0].icon).toBe("pineapple");
  });

  it("switches a user's skin only to one they own, and can unlock and wear at once", async () => {
    expect((await call("PUT", `/users/${camille.id}/skin`, { skin: "versus" })).status).toBe(400);
    await call("PUT", `/users/${camille.id}/skin`, { skin: "calm" });
    expect((await fresh(camille)).skin).toBe("calm");
    await call("POST", `/users/${camille.id}/unlocks`, { prizeId: "skin:versus", wear: true });
    expect((await fresh(camille)).skin).toBe("versus");
  });

  it("manages lists without losing the main one", async () => {
    const food = await addFood("Café");
    const own = await fresh(camille);
    const created = await call("POST", "/lists", { householdId: own.household.id, title: "Apéro" });
    await call("POST", `/lists/${created.body.id}/foods`, { foodIds: [food.id] });
    expect((await call("GET", `/lists/${created.body.id}`)).body.foods.map((entry: { name: string }) => entry.name)).toEqual(["Café"]);

    await call("PUT", `/lists/${created.body.id}`, { isMain: true });
    const mains = await m().find(ListEntity, { where: { household: { id: own.household.id }, isMain: true } });
    expect(mains.map((list) => list.id)).toEqual([created.body.id]);
    expect((await call("DELETE", `/lists/${created.body.id}`)).status).toBe(400);

    await call("DELETE", `/lists/${created.body.id}/foods/${food.id}`);
    expect((await call("GET", `/lists/${created.body.id}`)).body.foods).toEqual([]);
  });
});

describe("admin stats", () => {
  it("summarises the app", async () => {
    await m().update(UserEntity, camille.id, { language: "fr" });
    const stats = await call("GET", "/stats?days=30");
    expect(stats.status).toBe(200);
    expect(stats.body.growth).toMatchObject({ users: 2, newUsers: 2, households: 2 });
    expect(stats.body.growth.languages).toMatchObject({ fr: 1, phone: 1 });
    expect(stats.body.growth.signups).toHaveLength(30);
    expect(stats.body.business.unlocks.map((row: { skin: string }) => row.skin)).toEqual(["roast", "versus"]);
  });
});
