import { EXPO_PUSH_URL, PUSH_BATCH } from "../helpers";
import removePushTokens from "./removePushTokens";

type Ticket = { status: "ok" | "error"; details?: { error?: string } };

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  url: string;
  event: string;
  extra?: Record<string, string | number>;
};

const deliverPush = async (messages: PushMessage[]) => {
  const dead: string[] = [];
  let failed = 0;
  for (let start = 0; start < messages.length; start += PUSH_BATCH) {
    const batch = messages.slice(start, start + PUSH_BATCH);
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(
        batch.map(({ to, title, body, url, event, extra }) => ({
          to,
          title,
          body,
          sound: "default",
          channelId: "default",
          data: { url, event, ...extra },
        })),
      ),
    });
    if (!response.ok) throw new Error(`Expo push failed with ${response.status}`);
    const { data } = (await response.json()) as { data: Ticket[] };
    data.forEach((ticket, index) => {
      if (ticket.status !== "error") return;
      failed += 1;
      if (ticket.details?.error === "DeviceNotRegistered") dead.push(batch[index]!.to);
    });
  }
  await removePushTokens(dead);
  return { delivered: messages.length - failed, failed };
};

export default deliverPush;
