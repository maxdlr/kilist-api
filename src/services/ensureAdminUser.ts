import createHousehold from "@/api/households/services/createHousehold";
import HouseholdEntity from "@/entities/HouseholdEntity";
import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import bcrypt from "bcrypt";
import { EntityManager, Not } from "typeorm";

const ADMIN_USERNAME = "maxdlr";
const ADMIN_EMAIL = "contact@maxdlr.com";

const createAdmin = async (
  password: string,
  household: HouseholdEntity | undefined,
  m: EntityManager,
): Promise<UserEntity> => {
  const admin = new UserEntity();
  admin.username = ADMIN_USERNAME;
  admin.email = ADMIN_EMAIL;
  admin.password = password;
  admin.description = "Creator of this platform";
  admin.type = "admin";
  admin.emailConfirmedAt = new Date();
  admin.household = household ?? (await createHousehold(ADMIN_USERNAME, m));

  console.log(`Admin account "${ADMIN_USERNAME}" created`);
  return await m.save(UserEntity, admin);
};

const syncAdmin = async (
  admin: UserEntity,
  password: string,
  m: EntityManager,
): Promise<UserEntity> => {
  const isPasswordCurrent = bcrypt.compareSync(password, admin.password);
  const isAlreadyAdmin = admin.type === "admin";

  if (
    isPasswordCurrent &&
    isAlreadyAdmin &&
    admin.username === ADMIN_USERNAME &&
    admin.email === ADMIN_EMAIL
  ) {
    return admin;
  }

  admin.username = ADMIN_USERNAME;
  admin.email = ADMIN_EMAIL;
  admin.type = "admin";
  if (!isPasswordCurrent) {
    admin.password = password;
  }
  const saved = await m.save(UserEntity, admin);

  if (!isPasswordCurrent || !isAlreadyAdmin) {
    await m.update(
      RefreshTokenEntity,
      { userId: admin.id },
      { revokedOn: new Date(), revokedReason: "password-change" },
    );
  }

  console.log(`Admin account "${ADMIN_USERNAME}" updated`);
  return saved;
};

const ensureAdminUser = async (
  household?: HouseholdEntity,
  manager?: EntityManager,
): Promise<UserEntity> => {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }

  const run = async (m: EntityManager): Promise<UserEntity> => {
    const matches = await m
      .createQueryBuilder(UserEntity, "user")
      .addSelect("user._password")
      .where("user.username = :username OR user.email = :email", {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
      })
      .getMany();

    if (matches.length > 1) {
      throw new Error(
        `Cannot set up the admin account: username "${ADMIN_USERNAME}" and ` +
          `email "${ADMIN_EMAIL}" belong to different users. Resolve this manually.`,
      );
    }

    const existing = matches[0];
    const admin = existing
      ? await syncAdmin(existing, password, m)
      : await createAdmin(password, household, m);

    const { affected } = await m.update(
      UserEntity,
      { type: "admin", id: Not(admin.id) },
      { type: "user" },
    );
    if (affected) {
      console.warn(`Demoted ${affected} other admin account(s) to user`);
    }

    return admin;
  };

  return manager ? await run(manager) : await AppDataSource.transaction(run);
};

export default ensureAdminUser;
