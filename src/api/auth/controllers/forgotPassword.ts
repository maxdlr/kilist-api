import sendVerificationEmail from "@/api/verification/services/sendVerificationEmail";
import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import { Request, Response } from "express";

const forgotPassword = async ({ body }: Request, res: Response) => {
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) throw ApiError("An email is required");

  const user = await UserRepository.findOne({ where: { email } });
  if (user) await sendVerificationEmail(user as UserEntity, "reset");

  return res.status(202).end();
};

export default forgotPassword;
