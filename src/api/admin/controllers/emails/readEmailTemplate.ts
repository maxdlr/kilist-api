import { isEmailId, renderPreview } from "@/api/emails/previews";
import { DEFAULT_LANG, isLang } from "@/i18n";
import { Request, Response } from "express";

const readEmailTemplate = async ({ params, query }: Request, res: Response) => {
  const { id } = params;

  if (!isEmailId(id)) {
    throw Missing(`Email ${id} not found`);
  }

  const lang = isLang(query.lang) ? query.lang : DEFAULT_LANG;

  return res.status(200).json({ id, lang, ...renderPreview(id, lang, query.skin) });
};

export default readEmailTemplate;
