import adminRoutes from "@/api/admin/routes/index";
import createEmailLog from "@/api/emails/services/createEmailLog";
import removeUser from "@/api/users/services/removeUser";
import createUser from "@/api/users/services/createUser";
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

const makeUser = (name: string) =>
  createUser({
    username: name,
    email: `${name}@example.com`,
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });

const call = async (method: string, path: string, as: UserEntity = admin) => {
  const res = await fetch(`${baseUrl}/admin${path}`, {
    method,
    headers: { "x-test-user": String(as.id) },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  const app = express();
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
  await AppDataSource.manager.update(UserEntity, admin.id, { type: "admin" });
  camille = await makeUser("camille");
});

describe("admin emails", () => {
  it("stays admin-only", async () => {
    for (const path of ["/emails/templates", "/emails/templates/passwordReset", "/emails/history"]) {
      expect((await call("GET", path, camille)).status).toBe(403);
    }
  });

  it("is read-only", async () => {
    for (const method of ["POST", "PUT", "DELETE"]) {
      expect((await call(method, "/emails/templates/passwordReset")).status).toBe(404);
    }
  });

  it("lists every template, with one per unlockable skin", async () => {
    const { body } = await call("GET", "/emails/templates");

    expect(body).toHaveLength(9);
    expect(body).toContainEqual(expect.objectContaining({ id: "skinUnlock", skin: "roast" }));
    expect(body).toContainEqual(expect.objectContaining({ id: "passwordReset", skin: null }));
  });

  it("shows a template in the chosen language", async () => {
    const { body } = await call("GET", "/emails/templates/passwordReset?lang=fr");

    expect(body.subject).toBe("Ton code Kilist : 482917");
    expect(body.html).toContain('<html lang="fr">');
    expect(body.text).toContain("Valable 15 minutes");
    expect(body.preheader).toContain("15 minutes");
  });

  it("refuses an unknown template", async () => {
    expect((await call("GET", "/emails/templates/nope")).status).toBe(404);
  });

  it("lists the history newest first with the related user", async () => {
    await createEmailLog({ recipient: camille.email, emailId: "passwordReset", lang: "fr", status: "sent", userId: camille.id });
    await createEmailLog({ recipient: admin.email, emailId: "memberJoined", lang: "en", status: "failed", userId: admin.id, error: "refused" });

    const { body } = await call("GET", "/emails/history");

    expect(body.total).toBe(2);
    expect(body.items[0]).toMatchObject({ emailId: "memberJoined", status: "failed", error: "refused", user: { id: admin.id, username: "boss" } });
    expect(body.items[1]).toMatchObject({ emailId: "passwordReset", status: "sent", lang: "fr", user: { id: camille.id } });
  });

  it("filters the history by user, status and search", async () => {
    await createEmailLog({ recipient: camille.email, emailId: "passwordReset", lang: "en", status: "sent", userId: camille.id });
    await createEmailLog({ recipient: admin.email, emailId: "memberJoined", lang: "en", status: "failed", userId: admin.id });

    expect((await call("GET", `/emails/history?userId=${camille.id}`)).body.total).toBe(1);
    expect((await call("GET", "/emails/history?status=failed")).body.items[0].user.id).toBe(admin.id);
    expect((await call("GET", "/emails/history?search=camille")).body.items[0].recipient).toBe(camille.email);
    expect((await call("GET", "/emails/history?search=nobody")).body.total).toBe(0);
  });

  it("keeps the record once the user is deleted", async () => {
    await createEmailLog({ recipient: camille.email, emailId: "accountDeleted", lang: "en", status: "sent", userId: camille.id });

    await removeUser({ id: camille.id });

    const { body } = await call("GET", "/emails/history");
    expect(body.items[0]).toMatchObject({ recipient: camille.email, user: null });
  });
});
