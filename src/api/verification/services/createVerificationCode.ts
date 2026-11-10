import VerificationCodeEntity, { VerificationPurpose } from "@/entities/VerificationCodeEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager, IsNull } from "typeorm";
import { CODE_MINUTES, hashCode, newCode } from "../helpers";

const createVerificationCode = async (
  userId: number,
  purpose: VerificationPurpose,
  manager?: EntityManager,
) => {
  const m = findManager(UserRepository, manager);
  const code = newCode();
  await m.update(
    VerificationCodeEntity,
    { user: { id: userId }, purpose, usedAt: IsNull() },
    { usedAt: new Date() },
  );
  await m.save(VerificationCodeEntity, {
    user: { id: userId },
    purpose,
    codeHash: hashCode(userId, purpose, code),
    expiresAt: new Date(Date.now() + CODE_MINUTES[purpose] * 60000),
  } as VerificationCodeEntity);
  return { code, minutes: CODE_MINUTES[purpose] };
};

export default createVerificationCode;
