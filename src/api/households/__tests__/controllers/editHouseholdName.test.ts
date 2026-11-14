import createUser from "@/api/users/services/createUser";
import findUser from "@/api/users/services/findUser";
import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import editHouseholdName from "../../controllers/editHouseholdName";

let user: UserEntity;

const call = async (body: unknown) => {
  const out: { body?: any } = {};
  const res = {
    status: () => res,
    send: (value: unknown) => {
      out.body = value;
      return res;
    },
  } as unknown as Response;
  await editHouseholdName({ user, body } as unknown as Request, res);
  return out;
};

const savedName = async () =>
  (await AppDataSource.manager.findOneByOrFail(HouseholdEntity, { id: user.household.id })).name;

beforeEach(async () => {
  const created = await createUser({
    username: "namer",
    email: "namer@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  user = await findUser({ id: created.id });
});

describe("editHouseholdName", () => {
  it("renames the household of the person asking", async () => {
    const out = await call({ name: "  The flat  " });

    expect(out.body.name).toBe("The flat");
    expect(await savedName()).toBe("The flat");
  });

  it.each([undefined, "", "   ", "a".repeat(41), 7])("refuses %s", async (name) => {
    const before = await savedName();

    await expect(call({ name })).rejects.toMatchObject({ status: 400 });
    expect(await savedName()).toBe(before);
  });
});
