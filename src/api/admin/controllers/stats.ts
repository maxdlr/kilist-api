import AdminActionEntity from "@/entities/AdminActionEntity";
import { AppDataSource } from "@/services/database/datasource";
import { Request, Response } from "express";
import { toAction } from "../helpers";
import { adminStats } from "../services/stats";

export const readStats = async ({ query }: Request, res: Response) => {
  const days = [7, 30].includes(Number(query.days)) ? Number(query.days) : 0;
  return res.status(200).json(await adminStats(days));
};

export const browseActions = async ({ query }: Request, res: Response) => {
  const rows = await AppDataSource.manager.find(AdminActionEntity, {
    relations: { admin: true },
    order: { createdAt: "DESC", id: "DESC" },
    take: Math.min(100, Number(query.limit) || 30),
  });
  return res.status(200).json(rows.map(toAction));
};
