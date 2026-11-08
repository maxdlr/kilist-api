import { EmailLogStatus } from "@/entities/EmailLogEntity";
import { Lang } from "@/i18n";
import nodemailer from "nodemailer";
import { emailSettings } from "../helpers";
import { EmailId, EmailVars, renderEmail } from "../templates";
import createEmailLog from "./createEmailLog";

const sendEmail = async <K extends EmailId>(
  to: string,
  id: K,
  vars: EmailVars[K],
  lang: Lang,
  userId?: number,
): Promise<{ sent: boolean }> => {
  const settings = emailSettings();
  const email = renderEmail(id, vars, lang, settings);

  const record = (status: EmailLogStatus, error?: string) =>
    createEmailLog({ recipient: to, emailId: id, lang, status, userId, error }).catch(
      (logError) => console.error("Failed to log email", logError),
    );

  if (!settings.smtp) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`Email "${id}" not sent: SMTP is not configured`);
    } else if (process.env.NODE_ENV !== "test") {
      console.log(`[email not sent] ${to}: ${email.subject}\n${email.text}`);
    }
    await record("not_configured");
    return { sent: false };
  }

  const { host, port, user, password } = settings.smtp;
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });

  try {
    await transport.sendMail({
      from: settings.from,
      to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  } catch (error) {
    await record("failed", (error as Error)?.message);
    throw error;
  }

  await record("sent");
  return { sent: true };
};

export default sendEmail;
