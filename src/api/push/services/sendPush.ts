import { emailLang } from "@/api/emails/helpers";
import UserEntity from "@/entities/UserEntity";
import { EXPO_PUSH_URL, PUSH_BATCH, PUSH_TEXT } from "../helpers";
import findPushTokens from "./findPushTokens";
import removePushTokens from "./removePushTokens";

type Ticket = { status: "ok" | "error"; details?: { error?: string } };

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
  const dead: string[] = [];
  for (let start = 0; start < tokens.length; start += PUSH_BATCH) {
    const batch = tokens.slice(start, start + PUSH_BATCH);
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(
        batch.map((to) => ({ to, title, body, sound: "default", channelId: "default", data: { url, event } })),
      ),
    });
    if (!response.ok) throw new Error(`Expo push failed with ${response.status}`);
    const { data } = (await response.json()) as { data: Ticket[] };
    data.forEach((ticket, index) => {
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") dead.push(batch[index]!);
    });
  }
  await removePushTokens(dead);
  return tokens.length - dead.length;
};

export default sendPush;
