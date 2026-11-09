import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import importGuestData from "../services/importGuestData";

const postImport = async ({ body, user }: Request, res: Response) => {
  const imported = await doTransaction((m) => importGuestData(user!, body, m));

  return res.status(200).json({ imported });
};

export default postImport;
