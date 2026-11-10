import VerificationCodeEntity, { VerificationPurpose } from "@/entities/VerificationCodeEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { timingSafeEqual } from "crypto";
import { EntityManager, IsNull } from "typeorm";
import { hashCode, MAX_ATTEMPTS } from "../helpers";

const useVerificationCode = async (
  userId: number,
  purpose: VerificationPurpose,
  code: unknown,
  manager?: EntityManager,
) => {
  const m = findManager(UserRepository, manager);
  const entry = await m.findOne(VerificationCodeEntity, {
    where: { user: { id: userId }, purpose, usedAt: IsNull() },
    order: { createdAt: "DESC", id: "DESC" },
  });
  if (!entry) throw UserError(400, "code.invalid");
  if (entry.expiresAt.getTime() < Date.now()) throw UserError(400, "code.expired");
  if (entry.attempts >= MAX_ATTEMPTS) throw UserError(400, "code.tooManyAttempts");

  const expected = Buffer.from(entry.codeHash);
  const given = Buffer.from(hashCode(userId, purpose, String(code ?? "").trim()));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    await m.update(VerificationCodeEntity, entry.id, { attempts: entry.attempts + 1 });
    throw UserError(400, entry.attempts + 1 >= MAX_ATTEMPTS ? "code.tooManyAttempts" : "code.invalid");
  }

  await m.update(VerificationCodeEntity, entry.id, { usedAt: new Date() });
};

export default useVerificationCode;
