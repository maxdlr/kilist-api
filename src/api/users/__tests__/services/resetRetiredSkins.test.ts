import createUser from "@/api/users/services/createUser";
import findUser from "@/api/users/services/findUser";
import resetRetiredSkins from "@/api/users/services/resetRetiredSkins";
import UserRepository from "@/repositories/UserRepository";
import { describe, expect, it } from "vitest";

const makeUser = async (name: string, skin: string) => {
  const user = await createUser({
    username: name,
    email: `${name}@example.com`,
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  await UserRepository.update(user.id, { skin });
  return user;
};

describe("resetRetiredSkins", () => {
  it("puts people wearing a skin that left the catalog back on the default", async () => {
    const retired = await makeUser("retired", "arcade");
    const kept = await makeUser("kept", "roast");

    expect(await resetRetiredSkins()).toBe(1);
    expect((await findUser({ id: retired.id })).skin).toBe("calm");
    expect((await findUser({ id: kept.id })).skin).toBe("roast");
  });
});
