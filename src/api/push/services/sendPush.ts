import { emailLang } from "@/api/emails/helpers";
import UserEntity from "@/entities/UserEntity";
import { PUSH_TEXT } from "../helpers";
import deliverPush from "./deliverPush";
import findPushTokens from "./findPushTokens";

const sendPush = async (
  user: Pick<UserEntity, "id" | "language" | "deviceLanguage">,
  event: string,
  vars: Record<string, unknown>,
) => {
  const text = PUSH_TEXT[emailLang(user)][event];
  if (!text) return 0;
  const tokens = await findPushTokens(user.id);
  if (tokens.length === 0) return 0;

  const { title, body, url } = text(vars);
  const { delivered } = await deliverPush(tokens.map((to) => ({ to, title, body, url, event })));
  return delivered;
};

export default sendPush;
