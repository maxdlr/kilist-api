import createUser from "@/api/users/services/createUser";
import findUser from "@/api/users/services/findUser";
import UserEntity, { DEFAULT_SKIN } from "@/entities/UserEntity";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import editMySkin from "../controllers/editMySkin";

let user: UserEntity;

const call = async (body: unknown) => {
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

  await editMySkin({ user, body } as unknown as Request, res);
  return out;
};

beforeEach(async () => {
  user = await createUser({
    username: "skinner",
    email: "skinner@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
});

describe("editMySkin", () => {
  it("gives new users the default skin", async () => {
    expect((await findUser({ id: user.id })).skin).toBe(DEFAULT_SKIN);
  });

  it("saves the chosen skin and returns the user", async () => {
    const out = await call({ skin: "calm" });

    expect(out.status).toBe(200);
    expect(out.body.skin).toBe("calm");
    expect((await findUser({ id: user.id })).skin).toBe("calm");
  });

  it("refuses a premium skin the user hasn't unlocked", async () => {
    await expect(call({ skin: "roast" })).rejects.toMatchObject({ status: 403 });
    expect((await findUser({ id: user.id })).skin).toBe(DEFAULT_SKIN);
  });

  it("refuses a skin that isn't in the prize catalog", async () => {
    await expect(call({ skin: "zen-garden" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it.each([undefined, "", "Roast", "roast skin", "a".repeat(33), 42])(
    "rejects an invalid skin id %s",
    async (skin) => {
      await expect(call({ skin })).rejects.toBeTruthy();
      expect((await findUser({ id: user.id })).skin).toBe(DEFAULT_SKIN);
    },
  );
});
