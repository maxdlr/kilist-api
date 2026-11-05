import findUser from "@/api/users/services/findUser";
import createUser from "@/api/users/services/createUser";
import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import ListRepository from "@/repositories/ListRepository";
import RefreshTokenRepository from "@/repositories/RefreshTokenRepository";
import UserRepository from "@/repositories/UserRepository";
import ensureAdminUser from "@/services/ensureAdminUser";
import bcrypt from "bcrypt";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const PASSWORD = "Adm1n!Passw0rd";
const originalPassword = process.env.ADMIN_PASSWORD;

const makeUser = (username: string, email: string) =>
  createUser({
    username,
    email,
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
    householdName: `${username} home`,
  });

const storedHash = async (id: number) =>
  (await findUser({ id }, true)).password;

describe("ensureAdminUser", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = PASSWORD;
  });

  afterEach(() => {
    if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("creates the admin with the env password, in its own household", async () => {
    const stranger = await makeUser("stranger", "stranger@example.com");

    const admin = await ensureAdminUser();

    const reloaded = await findUser({ id: admin.id });
    expect(reloaded.username).toBe("maxdlr");
    expect(reloaded.email).toBe("contact@maxdlr.com");
    expect(reloaded.type).toBe("admin");
    expect(reloaded.household.id).not.toBe(stranger.household.id);
    expect(bcrypt.compareSync(PASSWORD, await storedHash(admin.id))).toBe(true);

    const lists = await ListRepository.find({
      where: { household: { id: reloaded.household.id } },
    });
    expect(lists).toHaveLength(1);
    expect(lists[0]?.isMain).toBe(true);
  });

  it("changes nothing when run again", async () => {
    const first = await ensureAdminUser();
    const hash = await storedHash(first.id);
    const households = await HouseholdRepository.count();

    const second = await ensureAdminUser();

    expect(second.id).toBe(first.id);
    expect(await storedHash(first.id)).toBe(hash);
    expect(await UserRepository.count()).toBe(1);
    expect(await HouseholdRepository.count()).toBe(households);
  });

  it("applies a changed ADMIN_PASSWORD on the next run", async () => {
    const admin = await ensureAdminUser();

    process.env.ADMIN_PASSWORD = "R0tated!Passw0rd";
    await ensureAdminUser();

    expect(
      bcrypt.compareSync("R0tated!Passw0rd", await storedHash(admin.id)),
    ).toBe(true);
  });

  it.each([
    ["username", "maxdlr", "someone@example.com"],
    ["email", "someone", "contact@maxdlr.com"],
  ])(
    "takes over a regular account holding the admin %s and ends its sessions",
    async (_field, username, email) => {
      const squatter = await makeUser(username, email);
      await RefreshTokenRepository.save({
        token: "squatter-token",
        expireOn: new Date(Date.now() + 60_000),
        userId: squatter.id,
      } as RefreshTokenEntity);

      const admin = await ensureAdminUser();

      expect(admin.id).toBe(squatter.id);
      const reloaded = await findUser({ id: squatter.id });
      expect(reloaded.type).toBe("admin");
      expect(reloaded.username).toBe("maxdlr");
      expect(reloaded.email).toBe("contact@maxdlr.com");
      expect(bcrypt.compareSync(PASSWORD, await storedHash(admin.id))).toBe(
        true,
      );

      const token = await RefreshTokenRepository.findOneBy({
        userId: squatter.id,
      });
      expect(token?.revokedOn).toBeTruthy();
    },
  );

  it("demotes any other admin", async () => {
    const other = await makeUser("other", "other@example.com");
    await UserRepository.update(other.id, { type: "admin" });

    await ensureAdminUser();

    expect((await findUser({ id: other.id })).type).toBe("user");
  });

  it("refuses to guess when username and email belong to different users", async () => {
    await makeUser("maxdlr", "someone@example.com");
    await makeUser("someone", "contact@maxdlr.com");

    await expect(ensureAdminUser()).rejects.toThrow("different users");
  });

  it("fails when ADMIN_PASSWORD is not set", async () => {
    delete process.env.ADMIN_PASSWORD;

    await expect(ensureAdminUser()).rejects.toThrow("ADMIN_PASSWORD");
    expect(await UserRepository.count()).toBe(0);
  });
});
