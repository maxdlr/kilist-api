import revokeAllRefreshTokenByUserId from "@/api/auth/services/revokeAllRefreshTokenByUserId";
import useVerificationCode from "@/api/verification/services/useVerificationCode";
import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import PasswordCheck from "@/utils/PasswordCheck";
import doTransaction from "@/utils/doTransaction";
import { validate } from "class-validator";
import { Request, Response } from "express";

const resetPassword = async ({ body }: Request, res: Response) => {
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const check = new PasswordCheck();
  check.password = password;
  const errors = await validate(check);
  if (errors.length > 0) {
    throw BadValidation([{ property: "password", messages: ["validation.password.weak"] }]);
  }

  const owner = await UserRepository.findOne({ where: { email }, select: { id: true } });
  if (!owner) throw UserError(400, "code.invalid");
  await useVerificationCode(owner.id, "reset", body?.code);

  await doTransaction(async (m) => {
    const user = await m.findOneOrFail(UserEntity, { where: { id: owner.id } });
    user.password = password;
    await m.save(UserEntity, user);
    await revokeAllRefreshTokenByUserId(user.id, "password-change", m);
  });

  return res.status(200).end();
};

export default resetPassword;
