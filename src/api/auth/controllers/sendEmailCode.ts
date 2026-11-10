import sendVerificationEmail from "@/api/verification/services/sendVerificationEmail";
import { Request, Response } from "express";

const sendEmailCode = async ({ user }: Request, res: Response) => {
  await sendVerificationEmail(user!, "confirm");
  return res.status(202).end();
};

export default sendEmailCode;
