import createUser from "@/api/users/services/createUser";
import findUser from "@/api/users/services/findUser";
import userRoutes from "@/api/users/routes/index";
import UserRepository from "@/repositories/UserRepository";
import serviceErrorHandler from "@/services/serviceErrorHandlers";
import wrapRoutesHandlers from "@/services/wrapRoutesHandlers";
import express from "express";
import jwt from "jsonwebtoken";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let server: Server;
let baseUrl: string;

const makeUser = async (name: string, type: "user" | "admin" = "user") => {
  const user = await createUser({
    username: name,
    email: `${name}@example.com`,
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
    householdName: `${name} home`,
  });
  if (type === "admin") await UserRepository.update(user.id, { type });
  return user;
};

const call = (
  path: string,
  { as, method = "GET", body }: { as?: number; method?: string; body?: unknown } = {},
) =>
  fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(as ? { "x-test-user": String(as) } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const id = req.headers["x-test-user"];
    (req as express.Request & { secret: string }).secret = "test-cookie-secret";
    req.signedCookies = id
      ? { auth: jwt.sign({ id: Number(id) }, process.env.JWT_SECRET) }
      : {};
    next();
  });
  wrapRoutesHandlers(userRoutes);
  app.use("/users", userRoutes);
  app.use(serviceErrorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

describe.each(["/users/browse", "/users/read?username=target"])(
  "GET %s",
  (path) => {
    it("rejects anonymous requests", async () => {
      await makeUser("target");
      expect((await call(path)).status).toBe(401);
    });

    it("rejects regular users", async () => {
      await makeUser("target");
      const regular = await makeUser("regular");
      expect((await call(path, { as: regular.id })).status).toBe(403);
    });

    it("allows admins", async () => {
      await makeUser("target");
      const admin = await makeUser("boss", "admin");
      const res = await call(path, { as: admin.id });
      expect(res.status).toBe(200);
      expect(JSON.stringify(await res.json())).toContain("target");
    });
  },
);

describe("PUT /users/edit", () => {
  it("does not let a user make themselves admin", async () => {
    const regular = await makeUser("regular");

    const res = await call("/users/edit", {
      as: regular.id,
      method: "PUT",
      body: { type: "admin" },
    });

    expect(res.status).toBe(200);
    expect((await findUser({ id: regular.id })).type).toBe("user");
  });

  it("does not let a user edit someone else through the body", async () => {
    const regular = await makeUser("regular");
    const victim = await makeUser("victim");

    await call("/users/edit", {
      as: regular.id,
      method: "PUT",
      body: { id: victim.id, description: "hacked" },
    });

    expect((await findUser({ id: victim.id })).description).not.toBe("hacked");
    expect((await findUser({ id: regular.id })).description).toBe("hacked");
  });
});

describe("DELETE /users/delete", () => {
  const remove = (id: number, as?: number) =>
    call(`/users/delete?id=${id}`, { as, method: "DELETE" });
  const exists = async (id: number) =>
    (await UserRepository.findOneBy({ id })) !== null;

  it("rejects anonymous requests", async () => {
    const user = await makeUser("regular");
    expect((await remove(user.id)).status).toBe(401);
    expect(await exists(user.id)).toBe(true);
  });

  it("lets a user delete their own account and clears their cookies", async () => {
    const user = await makeUser("regular");

    const res = await remove(user.id, user.id);

    expect(res.status).toBe(200);
    expect(await exists(user.id)).toBe(false);
    const cookies = res.headers.getSetCookie().join(";");
    expect(cookies).toContain("auth=");
    expect(cookies).toContain("refresh=");
  });

  it("does not let a user delete someone else", async () => {
    const user = await makeUser("regular");
    const victim = await makeUser("victim");

    expect((await remove(victim.id, user.id)).status).toBe(403);
    expect(await exists(victim.id)).toBe(true);
  });

  it("lets the admin delete someone else, keeping the admin's cookies", async () => {
    const admin = await makeUser("boss", "admin");
    const user = await makeUser("regular");

    const res = await remove(user.id, admin.id);

    expect(res.status).toBe(200);
    expect(await exists(user.id)).toBe(false);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it("does not let the admin delete their own account", async () => {
    const admin = await makeUser("boss", "admin");

    expect((await remove(admin.id, admin.id)).status).toBe(400);
    expect(await exists(admin.id)).toBe(true);
  });

  it("answers 401 to a token whose user was deleted", async () => {
    const user = await makeUser("regular");
    await remove(user.id, user.id);

    expect((await remove(user.id, user.id)).status).toBe(401);
  });
});
