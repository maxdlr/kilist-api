import notifyUser from "@/api/notifications/services/notifyUser";
import createUser from "@/api/users/services/createUser";
import PushTokenEntity from "@/entities/PushTokenEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import deletePushToken from "../controllers/deletePushToken";
import postPushToken from "../controllers/postPushToken";

const TOKEN = "ExponentPushToken[abcdefghijklmnop]";
const OTHER = "ExponentPushToken[qrstuvwxyz012345]";
let user: UserEntity;

const res = () => {
  const r: any = {};
  r.status = (code: number) => ((r.code = code), r);
  r.end = () => r;
  return r as Response & { code: number };
};
const tokens = () => AppDataSource.manager.find(PushTokenEntity, { relations: ["user"] });
const vars = { name: "n", email: "e@example.com", member: "Sam", household: "Home", players: 2 };

const mockExpo = (tickets: unknown[]) => {
  const fetchMock = vi.fn(async (_url: string, _init: { body: string }) => ({
    ok: true,
    status: 200,
    json: async () => ({ data: tickets }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(async () => {
  user = await createUser({ username: "pushy", email: "pushy@example.com", password: "Str0ng!Passw0rd", householdChoice: "create" });
});
afterEach(() => vi.unstubAllGlobals());

describe("push tokens", () => {
  it("saves a token once and moves it to whoever signs in on that phone", async () => {
    await postPushToken({ body: { token: TOKEN, platform: "android" }, user } as Request, res());
    await postPushToken({ body: { token: TOKEN, platform: "android" }, user } as Request, res());
    const other = await createUser({ username: "other", email: "other@example.com", password: "Str0ng!Passw0rd", householdChoice: "create" });
    await postPushToken({ body: { token: TOKEN }, user: other } as Request, res());

    const saved = await tokens();
    expect(saved).toHaveLength(1);
    expect(saved[0]!.user.id).toBe(other.id);
  });

  it("refuses something that isn't an Expo token", async () => {
    await expect(postPushToken({ body: { token: "nope" }, user } as Request, res())).rejects.toMatchObject({ status: 400 });
  });

  it("forgets the token on logout", async () => {
    await postPushToken({ body: { token: TOKEN }, user } as Request, res());
    await deletePushToken({ body: { token: TOKEN }, user } as Request, res());
    expect(await tokens()).toHaveLength(0);
  });
});

describe("sending", () => {
  it("pushes to every phone of the user when they chose push", async () => {
    await postPushToken({ body: { token: TOKEN }, user } as Request, res());
    await postPushToken({ body: { token: OTHER }, user } as Request, res());
    const fetchMock = mockExpo([{ status: "ok" }, { status: "ok" }]);

    await notifyUser(user, "memberJoined", vars);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(sent.map((message: any) => message.to).sort()).toEqual([TOKEN, OTHER].sort());
    expect(sent[0]).toMatchObject({ body: "Sam joined Home.", data: { url: "/account", event: "memberJoined" } });
  });

  it("sends nothing when the user turned push off", async () => {
    await postPushToken({ body: { token: TOKEN }, user } as Request, res());
    const fetchMock = mockExpo([]);
    await notifyUser({ ...user, notifications: { memberJoined: "none" } }, "memberJoined", vars);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops tokens Expo says are dead", async () => {
    await postPushToken({ body: { token: TOKEN }, user } as Request, res());
    await postPushToken({ body: { token: OTHER }, user } as Request, res());
    mockExpo([{ status: "ok" }, { status: "error", details: { error: "DeviceNotRegistered" } }]);

    await notifyUser(user, "memberJoined", vars);

    expect(await tokens()).toHaveLength(1);
  });

  it("writes in the user's language", async () => {
    await postPushToken({ body: { token: TOKEN }, user } as Request, res());
    const fetchMock = mockExpo([{ status: "ok" }]);
    await notifyUser({ ...user, language: "fr" }, "memberLeft", vars);
    expect(JSON.parse((fetchMock.mock.calls[0] as any)[1].body)[0].body).toBe("Sam a quitté Home.");
  });
});
