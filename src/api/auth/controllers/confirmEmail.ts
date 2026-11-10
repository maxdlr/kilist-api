import findUser from "@/api/users/services/findUser";
import updateUserColumns from "@/api/users/services/updateUserColumns";
import useVerificationCode from "@/api/verification/services/useVerificationCode";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";

const confirmEmail = async ({ body, user }: Request, res: Response) => {
  await useVerificationCode(user!.id, "confirm", body?.code);
  const updated = await doTransaction(async (m) => {
    await updateUserColumns(user!.id, { emailConfirmedAt: new Date() }, m);
    return findUser({ id: user!.id }, false, m);
  });
  return res.status(200).send(updated);
};

export default confirmEmail;
