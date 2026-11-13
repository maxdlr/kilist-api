import type { GoogleIdentity } from "@/api/auth/services/verifyGoogleToken";
import { randomBytes } from "crypto";
import { EntityManager } from "typeorm";
import createUser from "./createUser";
import findFreeUsername from "./findFreeUsername";
import updateUserColumns from "./updateUserColumns";

const createGoogleUser = async (identity: GoogleIdentity, manager: EntityManager) => {
  const user = await createUser(
    {
      email: identity.email,
      username: await findFreeUsername(identity.name, manager),
      password: `Aa1!${randomBytes(24).toString("hex")}`,
      householdChoice: "create",
    },
    manager,
  );
  const confirmed = { googleId: identity.googleId, emailConfirmedAt: new Date() };
  await updateUserColumns(user.id, confirmed, manager);
  return Object.assign(user, confirmed);
};

export default createGoogleUser;
