import revokeAllRefreshTokenByUserId from "@/api/auth/services/revokeAllRefreshTokenByUserId";
import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { randomBytes } from "crypto";
import { EntityManager } from "typeorm";

const linkGoogleAccount = async (
  user: Pick<UserEntity, "id" | "emailConfirmedAt">,
  googleId: string,
  manager?: EntityManager,
) => {
  const m = findManager(UserRepository, manager);
  const stored = await m.findOneOrFail(UserEntity, { where: { id: user.id } });
  stored.googleId = googleId;

  if (!user.emailConfirmedAt) {
    stored.emailConfirmedAt = new Date();
    stored.password = `Aa1!${randomBytes(24).toString("hex")}`;
    await revokeAllRefreshTokenByUserId(user.id, "password-change", m);
  }

  await m.save(UserEntity, stored);
};

export default linkGoogleAccount;
