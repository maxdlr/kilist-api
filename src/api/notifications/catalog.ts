export type NotificationChoice = "none" | "email" | "push" | "both";
export type NotificationChannel = "email" | "push";

export type NotificationEvent = {
  id: "memberJoined" | "memberLeft" | "skinUnlock" | "productNews" | "dailyReminder";
  channels: NotificationChannel[];
  default: NotificationChoice;
  guestDefault: NotificationChoice;
};

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  { id: "memberJoined", channels: ["email", "push"], default: "push", guestDefault: "push" },
  { id: "memberLeft", channels: ["email", "push"], default: "push", guestDefault: "push" },
  { id: "skinUnlock", channels: ["email", "push"], default: "push", guestDefault: "push" },
  { id: "productNews", channels: ["email", "push"], default: "none", guestDefault: "push" },
  { id: "dailyReminder", channels: ["push"], default: "push", guestDefault: "push" },
];

export const ALWAYS_EMAIL = ["passwordReset", "signupConfirm", "accountDeleted", "purchaseConfirm"] as const;

export const choicesFor = (event: NotificationEvent): NotificationChoice[] => [
  "none",
  ...event.channels,
  ...(event.channels.length > 1 ? (["both"] as const) : []),
];

export const findEvent = (id: unknown) => NOTIFICATION_EVENTS.find((event) => event.id === id);

export const choiceOf = (
  notifications: Record<string, string> | null | undefined,
  event: NotificationEvent,
): NotificationChoice => {
  const saved = notifications?.[event.id] as NotificationChoice | undefined;
  return saved && choicesFor(event).includes(saved) ? saved : event.default;
};
