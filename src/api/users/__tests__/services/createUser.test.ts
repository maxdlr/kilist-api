import HouseholdRepository from "@/repositories/HouseholdRepository";
import generateJoinCode from "@/utils/generateJoinCode";
import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import createUser from "../../services/createUser";

const validUserInput = () => ({
  username: faker.internet.displayName(),
  email: faker.internet.email(),
  password: "Str0ng!Passw0rd",
});

describe("createUser", () => {
  it("creates a new household when householdChoice is 'create'", async () => {
    const user = await createUser({
      ...validUserInput(),
      householdChoice: "create",
      householdName: "The Testers",
    });

    expect(user.household).toBeDefined();
    expect(user.household.name).toBe("The Testers");
    expect(user.household.joinCode).toBeTruthy();
  });

  it("creates a household with no name when householdName is omitted", async () => {
    const user = await createUser({
      ...validUserInput(),
      householdChoice: "create",
    });

    expect(user.household).toBeDefined();
    expect(user.household.name).toBeFalsy();
  });

  it("joins an existing household when householdChoice is 'join' with a valid joinCode", async () => {
    const existingHousehold = await HouseholdRepository.save({
      name: "Existing Household",
      joinCode: generateJoinCode(),
    });

    const user = await createUser({
      ...validUserInput(),
      householdChoice: "join",
      joinCode: existingHousehold.joinCode,
    });

    expect(user.household.id).toBe(existingHousehold.id);
  });

  it("rejects joining with an unknown joinCode", async () => {
    await expect(
      createUser({
        ...validUserInput(),
        householdChoice: "join",
        joinCode: "DOESNOTEXIST",
      }),
    ).rejects.toThrow();
  });

  it("rejects a missing householdChoice", async () => {
    await expect(
      createUser({
        ...validUserInput(),
      } as Parameters<typeof createUser>[0]),
    ).rejects.toThrow();
  });

  it("rejects a 'join' choice with no joinCode", async () => {
    await expect(
      createUser({
        ...validUserInput(),
        householdChoice: "join",
      } as Parameters<typeof createUser>[0]),
    ).rejects.toThrow();
  });

  it("does not create a household when the username is already taken", async () => {
    const input = validUserInput();
    await createUser({ ...input, householdChoice: "create" });

    const householdCountBefore = await HouseholdRepository.count();

    await expect(
      createUser({
        ...input,
        email: faker.internet.email(),
        householdChoice: "create",
      }),
    ).rejects.toThrow();

    const householdCountAfter = await HouseholdRepository.count();
    expect(householdCountAfter).toBe(householdCountBefore);
  });

  it("multiple users can join the same household via its joinCode", async () => {
    const first = await createUser({
      ...validUserInput(),
      householdChoice: "create",
      householdName: "Shared Home",
    });

    const second = await createUser({
      ...validUserInput(),
      householdChoice: "join",
      joinCode: first.household.joinCode,
    });

    expect(second.household.id).toBe(first.household.id);

    const household = await HouseholdRepository.findOne({
      where: { id: first.household.id },
      relations: ["members"],
    });
    expect(household?.members).toHaveLength(2);
  });
});
