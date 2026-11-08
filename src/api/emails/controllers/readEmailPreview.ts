import { DEFAULT_LANG, isLang } from "@/i18n";
import { Request, Response } from "express";
import { isEmailId, renderPreview } from "../previews";

const readEmailPreview = async ({ params, query }: Request, res: Response) => {
  const { id } = params;

  if (!isEmailId(id)) {
    throw Missing(`Email ${id} not found`);
  }

  const lang = isLang(query.lang) ? query.lang : DEFAULT_LANG;
  const email = renderPreview(id, lang, query.skin);

  if (query.format === "text") {
    return res.status(200).type("text/plain").send(`Subject: ${email.subject}\n\n${email.text}`);
  }

  return res.status(200).type("html").send(email.html);
};

export default readEmailPreview;
