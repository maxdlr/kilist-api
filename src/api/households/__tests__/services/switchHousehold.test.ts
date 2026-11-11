import createUser from "@/api/users/services/createUser";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import ListRepository from "@/repositories/ListRepository";
import UserRepository from "@/repositories/UserRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import switchHousehold from "../../services/switchHousehold";

const makeUser = async (confirmed = true) => {
  const user = await createUser({
    username: faker.internet.displayName(),
    email: faker.internet.email(),
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
    householdName: "Origin Household",
  });
  if (confirmed) await UserRepository.update(user.id, { emailConfirmedAt: new Date() });
  return user;
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

  it("gives a household created by switching its own main list", async () => {
    const user = await makeUser();

    const result = await switchHousehold(user.id, {
      householdChoice: "create",
      householdName: "Fresh Household",
    });

    const lists = await ListRepository.find({
      where: { household: { id: result.id } },
    });
    expect(lists).toHaveLength(1);
    expect(lists[0]?.isMain).toBe(true);
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

  it("deletes the previous household when its last member leaves", async () => {
    const user = await makeUser();
    const originalHouseholdId = user.household.id;

    await switchHousehold(user.id, {
      householdChoice: "create",
      householdName: "Somewhere Else",
    });

    expect(await HouseholdRepository.findOne({ where: { id: originalHouseholdId } })).toBeNull();
    const kept = await HouseholdRepository.findOne({ where: { id: originalHouseholdId }, withDeleted: true });
    expect(kept?.deletedAt).toBeInstanceOf(Date);
  });

  it("keeps the previous household while a housemate is still in it", async () => {
    const user = await makeUser();
    const housemate = await makeUser();
    await switchHousehold(housemate.id, { householdChoice: "join", joinCode: user.household.joinCode });

    await switchHousehold(user.id, { householdChoice: "create" });

    expect(await HouseholdRepository.findOne({ where: { id: user.household.id } })).not.toBeNull();
  });

  it("refuses to join a household before the email is confirmed", async () => {
    const user = await makeUser(false);
    const target = await HouseholdRepository.save({
      name: "Target Household",
      joinCode: generateJoinCode(),
    });

    await expect(
      switchHousehold(user.id, { householdChoice: "join", joinCode: target.joinCode }),
    ).rejects.toMatchObject({ status: 403, code: "email.unconfirmed" });
  });

  it("lets an unconfirmed user create a new household", async () => {
    const user = await makeUser(false);

    const result = await switchHousehold(user.id, { householdChoice: "create" });

    expect(result.id).not.toBe(user.household.id);
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
