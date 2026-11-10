import notifyUser from "@/api/notifications/services/notifyUser";
import { VerificationPurpose } from "@/entities/VerificationCodeEntity";
import UserEntity from "@/entities/UserEntity";
import createVerificationCode from "./createVerificationCode";

const sendVerificationEmail = async (user: UserEntity, purpose: VerificationPurpose) => {
  const { code, minutes } = await createVerificationCode(user.id, purpose);
  await notifyUser(user, purpose === "reset" ? "passwordReset" : "signupConfirm", {
    name: user.username,
    email: user.email,
    code,
    minutes,
  });
};

export default sendVerificationEmail;
