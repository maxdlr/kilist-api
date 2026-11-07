import createUser from "@/api/users/services/createUser";
import findUser from "@/api/users/services/findUser";
import UserEntity from "@/entities/UserEntity";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import editMyLanguage from "../controllers/editMyLanguage";

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
  await editMyLanguage({ user, body } as unknown as Request, res);
  return out;
};

beforeEach(async () => {
  user = await createUser({
    username: "polyglot",
    email: "polyglot@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
});

describe("editMyLanguage", () => {
  it("follows the phone by default", async () => {
    expect((await findUser({ id: user.id })).language).toBeNull();
  });

  it("saves a supported language", async () => {
    const out = await call({ language: "fr" });
    expect(out.body.language).toBe("fr");
  });

  it("goes back to following the phone", async () => {
    await call({ language: "fr" });
    expect((await call({ language: null })).body.language).toBeNull();
  });

  it("refuses an unsupported language", async () => {
    await expect(call({ language: "de" })).rejects.toBeTruthy();
  });
});
