import createUser from "@/api/users/services/createUser";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import UserRepository from "@/repositories/UserRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import switchHousehold from "../../services/switchHousehold";

const makeUser = async () => {
  return await createUser({
    username: faker.internet.displayName(),
    email: faker.internet.email(),
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
    householdName: "Origin Household",
  });
};

describe("switchHousehold", () => {
  it("moves a user into an existing household via its join code", async () => {
    const user = await makeUser();
    const target = await HouseholdRepository.save({
      name: "Target Household",
      joinCode: generateJoinCode(),
    });

    const result = await switchHousehold(user.id, {
      householdChoice: "join",
      joinCode: target.joinCode,
    });

    expect(result.id).toBe(target.id);

    const reloaded = await UserRepository.findOne({
      where: { id: user.id },
      relations: ["household"],
    });
    expect(reloaded?.household.id).toBe(target.id);
  });

  it("creates and moves the user into a brand new household", async () => {
    const user = await makeUser();
    const originalHouseholdId = user.household.id;

    const result = await switchHousehold(user.id, {
      householdChoice: "create",
      householdName: "Fresh Household",
    });

    expect(result.id).not.toBe(originalHouseholdId);
    expect(result.name).toBe("Fresh Household");

    const reloaded = await UserRepository.findOne({
      where: { id: user.id },
      relations: ["household"],
    });
    expect(reloaded?.household.id).toBe(result.id);
  });

  it("leaves the previous household intact (not deleted) after switching", async () => {
    const user = await makeUser();
    const originalHouseholdId = user.household.id;

    await switchHousehold(user.id, {
      householdChoice: "create",
      householdName: "Somewhere Else",
    });

    const previous = await HouseholdRepository.findOne({
      where: { id: originalHouseholdId },
    });
    expect(previous).not.toBeNull();
  });

  it("rejects joining with an unknown join code", async () => {
    const user = await makeUser();

    await expect(
      switchHousehold(user.id, {
        householdChoice: "join",
        joinCode: "NOPEXX",
      }),
    ).rejects.toThrow();
  });

  it("rejects switching into the household the user is already in", async () => {
    const user = await makeUser();

    await expect(
      switchHousehold(user.id, {
        householdChoice: "join",
        joinCode: user.household.joinCode,
      }),
    ).rejects.toThrow();
  });

  it("rejects an invalid household choice", async () => {
    const user = await makeUser();

    await expect(switchHousehold(user.id, {})).rejects.toThrow();
  });
});
