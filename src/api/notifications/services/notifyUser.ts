import { emailLang } from "@/api/emails/helpers";
import sendEmail from "@/api/emails/services/sendEmail";
import { EmailId, EmailVars } from "@/api/emails/templates";
import sendPush from "@/api/push/services/sendPush";
import UserEntity from "@/entities/UserEntity";
import { ALWAYS_EMAIL, choiceOf, findEvent } from "../catalog";

type Recipient = Pick<UserEntity, "id" | "email" | "language" | "deviceLanguage" | "notifications">;

const notifyUser = async <K extends EmailId>(user: Recipient, id: K, vars: EmailVars[K]) => {
  const event = findEvent(id);
  const choice = (ALWAYS_EMAIL as readonly string[]).includes(id) ? "email" : event ? choiceOf(user.notifications, event) : "none";

  if (choice === "push" || choice === "both") {
    await sendPush(user, id, vars as Record<string, unknown>).catch((error) =>
      console.error(`Failed to send ${id} push`, error?.message ?? error),
    );
  }
  if ((choice === "email" || choice === "both") && user.email) {
    await sendEmail(user.email, id, vars, emailLang(user), id === "accountDeleted" ? undefined : user.id).catch((error) =>
      console.error(`Failed to send ${id} email`, error?.message ?? error),
    );
  }
  return choice;
};

export default notifyUser;
