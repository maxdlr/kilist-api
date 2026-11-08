import { previewVariants, renderPreview } from "@/api/emails/previews";
import { DEFAULT_LANG } from "@/i18n";
import { Request, Response } from "express";

const browseEmailTemplates = async (_req: Request, res: Response) =>
  res.status(200).json(
    previewVariants().map(({ id, skin }) => ({
      id,
      skin,
      subject: renderPreview(id, DEFAULT_LANG, skin).subject,
    })),
  );

export default browseEmailTemplates;
