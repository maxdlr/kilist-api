import createUser from "@/api/users/services/createUser";
import HouseholdEntity from "@/entities/HouseholdEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import doTransaction from "@/utils/doTransaction";
import { describe, expect, it } from "vitest";

const saveHousehold = (m: Parameters<Parameters<typeof doTransaction>[0]>[0]) =>
  m.save(HouseholdEntity, { joinCode: generateJoinCode() });

describe("doTransaction", () => {
  it("returns the transaction's result", async () => {
    await expect(doTransaction(async () => "done")).resolves.toBe("done");
  });

  it("keeps the status of an intended error and rolls back", async () => {
    const failure = doTransaction(async (m) => {
      await saveHousehold(m);
      throw Missing("Nope");
    });

    await expect(failure).rejects.toMatchObject({
      status: 404,
      message: "Nope",
    });
    expect(await HouseholdRepository.count()).toBe(0);
  });

  it("keeps validation details", async () => {
    const validation = [{ property: "name", messages: ["Required"] }];

    await expect(
      doTransaction(async () => {
        throw BadValidation(validation);
      }),
    ).rejects.toMatchObject({ status: 400, validation });
  });

  it("turns an unexpected error into a 500 and rolls back", async () => {
    const failure = doTransaction(async (m) => {
      await saveHousehold(m);
      throw new Error("boom");
    });

    await expect(failure).rejects.toMatchObject({
      status: 500,
      message: "boom",
    });
    expect(await HouseholdRepository.count()).toBe(0);
  });

  it("makes a bad join code a 404 for the caller", async () => {
    await expect(
      createUser({
        username: "joiner",
        email: "joiner@example.com",
        password: "Str0ng!Passw0rd",
        householdChoice: "join",
        joinCode: "NOPE",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
