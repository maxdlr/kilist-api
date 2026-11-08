import { LANGS } from "@/i18n";
import { Request, Response } from "express";
import { previewVariants } from "../previews";

const browseEmailPreviews = async (_req: Request, res: Response) => {
  const links = previewVariants()
    .flatMap(({ id, skin }) =>
      LANGS.map((lang) => {
        const query = `lang=${lang}${skin ? `&skin=${skin}` : ""}`;
        return `<li><a href="/emails/preview/${id}?${query}">${id}${skin ? ` (${skin})` : ""}: ${lang}</a></li>`;
      }),
    )
    .join("");

  return res.status(200).type("html").send(`<!doctype html><title>Kilist emails</title><ul>${links}</ul>`);
};

export default browseEmailPreviews;
