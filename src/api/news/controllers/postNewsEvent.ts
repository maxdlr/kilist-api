import { idOf } from "@/api/admin/helpers";
import { isInstallId } from "@/api/push/helpers";
import { NEWS_EVENT_KINDS, NewsEventKind } from "@/entities/NewsEventEntity";
import { Request, Response } from "express";
import recordNewsEvent from "../services/recordNewsEvent";

const postNewsEvent = async ({ params, body }: Request, res: Response) => {
  if (!isInstallId(body?.installId)) {
    throw BadValidation([{ property: "installId", messages: ["A valid install id is required"] }]);
  }
  if (!(NEWS_EVENT_KINDS as readonly string[]).includes(body?.kind)) {
    throw BadValidation([{ property: "kind", messages: [`kind must be one of ${NEWS_EVENT_KINDS.join(", ")}`] }]);
  }
  await recordNewsEvent(idOf(params.id), body.installId, body.kind as NewsEventKind);
  return res.status(204).end();
};

export default postNewsEvent;
