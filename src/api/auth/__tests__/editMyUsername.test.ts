import createUser from "@/api/users/services/createUser";
import findUser from "@/api/users/services/findUser";
import UserEntity from "@/entities/UserEntity";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import editMyUsername from "../controllers/editMyUsername";

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
  await editMyUsername({ user, body } as unknown as Request, res);
  return out;
};

beforeEach(async () => {
  user = await createUser({
    username: "renamer",
    email: "renamer@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
});

describe("editMyUsername", () => {
  it("saves a new name without the spaces around it", async () => {
    const out = await call({ username: "  Camille  " });

    expect(out.body.username).toBe("Camille");
    expect((await findUser({ id: user.id })).username).toBe("Camille");
  });

  it("keeps the same name when nothing changed", async () => {
    expect((await call({ username: "renamer" })).body.username).toBe("renamer");
  });

  it("refuses a name another account uses", async () => {
    await createUser({
      username: "taken",
      email: "taken@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });

    await expect(call({ username: "taken" })).rejects.toMatchObject({ status: 400 });
    expect((await findUser({ id: user.id })).username).toBe("renamer");
  });

  it.each([undefined, "", "  ", "ab", "a".repeat(31), 42])("refuses %s", async (username) => {
    await expect(call({ username })).rejects.toMatchObject({ status: 400 });
  });
});
