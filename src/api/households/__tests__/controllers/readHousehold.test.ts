import createUser from "@/api/users/services/createUser";
import findUser from "@/api/users/services/findUser";
import { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import readHousehold from "../../controllers/readHousehold";

const read = async (userId: number) => {
  const user = await findUser({ id: userId });
  let body: { members: Record<string, unknown>[] } | undefined;
  const res = {
    status: () => res,
    send: (value: typeof body) => {
      body = value;
      return res;
    },
  } as unknown as Response;

  await readHousehold({ user } as unknown as Request, res);

  return body!;
};

describe("readHousehold", () => {
  it("lists members without their emails", async () => {
    const owner = await createUser({
      username: "owner",
      email: "owner@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });
    await createUser({
      username: "joiner",
      email: "joiner@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "join",
      joinCode: owner.household.joinCode,
    });

    const { members } = await read(owner.id);

    expect(members.map((m) => m.username)).toEqual(["joiner", "owner"]);
    expect(JSON.stringify(members)).not.toContain("@example.com");
  });
});
