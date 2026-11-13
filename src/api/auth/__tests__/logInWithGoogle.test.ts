import createUser from "@/api/users/services/createUser";
import findUser from "@/api/users/services/findUser";
import FoodRepository from "@/repositories/FoodRepository";
import UserRepository from "@/repositories/UserRepository";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import logInWithGoogle from "../controllers/logInWithGoogle";

const google = vi.hoisted(() => ({ identity: { googleId: "", email: "", name: "" } }));

vi.mock("../services/verifyGoogleToken", () => ({
  default: async () => google.identity,
}));

const PASSWORD = "Str0ng!Passw0rd";
let run = 0;

const signIn = async (body: Record<string, unknown> = {}) => {
  let sent: any;
  const cookies: string[] = [];
  const res = {
    cookie: (name: string) => cookies.push(name),
    status: () => res,
    send: (value: unknown) => ((sent = value), res),
  } as unknown as Response;
  await logInWithGoogle({ body: { idToken: "token", ...body } } as Request, res);
  return { sent, cookies };
};

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
});

beforeEach(() => {
  run += 1;
  const tag = `g${Date.now()}${run}`;
  google.identity = { googleId: `sub-${tag}`, email: `${tag}@example.com`, name: `Zoé ${tag}` };
});

describe("signing in with Google", () => {
  it("creates a confirmed account with its own household, then logs into it", async () => {
    const first = await signIn();

    expect(first.sent).toEqual({ created: true });
    expect(first.cookies).toEqual(["auth", "refresh"]);
    const user = await findUser({ email: google.identity.email });
    expect(user.username).toMatch(/^zoeg\d+$/);
    expect(user.googleId).toBe(google.identity.googleId);
    expect(user.emailConfirmedAt).toBeTruthy();
    expect(user.household.id).toBeGreaterThan(0);

    const second = await signIn();

    expect(second.sent).toEqual({ created: false });
    expect(await UserRepository.countBy({ email: google.identity.email })).toBe(1);
  });

  it("picks another username when the name is taken", async () => {
    await signIn();
    const taken = (await findUser({ email: google.identity.email })).username;

    google.identity = { ...google.identity, googleId: `${google.identity.googleId}-b`, email: `b${google.identity.email}` };
    await signIn();

    expect((await findUser({ email: google.identity.email })).username).toBe(`${taken}2`);
  });

  it("links an account with a confirmed email and keeps its password", async () => {
    const existing = await createUser({
      username: `user${run}${Date.now()}`,
      email: google.identity.email,
      password: PASSWORD,
      householdChoice: "create",
    });
    await UserRepository.update(existing.id, { emailConfirmedAt: new Date() });

    const { sent } = await signIn();

    expect(sent).toEqual({ created: false });
    const linked = await findUser({ id: existing.id }, true);
    expect(linked.googleId).toBe(google.identity.googleId);
    expect(bcrypt.compareSync(PASSWORD, linked.password)).toBe(true);
  });

  it("replaces the password of an account whose email was never confirmed", async () => {
    const existing = await createUser({
      username: `user${run}${Date.now()}`,
      email: google.identity.email,
      password: PASSWORD,
      householdChoice: "create",
    });

    await signIn();

    const linked = await findUser({ id: existing.id }, true);
    expect(bcrypt.compareSync(PASSWORD, linked.password)).toBe(false);
    expect((await findUser({ id: existing.id })).emailConfirmedAt).toBeTruthy();
  });

  it("keeps what a guest learned when the account is created", async () => {
    const guest = {
      importId: `import-${google.identity.googleId}`,
      sentAt: new Date().toISOString(),
      tzOffset: 0,
      foods: [{ id: -1, name: "Milk", inStockScore: 0.5, onList: true }],
    };

    await signIn({ guest });

    const user = await findUser({ email: google.identity.email });
    expect(await FoodRepository.countBy({ household: { id: user.household.id } })).toBe(1);
  });
});
