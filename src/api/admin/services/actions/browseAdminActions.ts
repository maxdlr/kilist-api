import AdminActionEntity from "@/entities/AdminActionEntity";
import AdminActionRepository from "@/repositories/AdminActionRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import { toAction } from "../../helpers";

const browseAdminActions = async (limit: unknown, manager?: EntityManager) => {
  const rows = await findManager(AdminActionRepository, manager).find(AdminActionEntity, {
    relations: { admin: true },
    order: { createdAt: "DESC", id: "DESC" },
    take: Math.min(100, Number(limit) || 30),
  });
  return rows.map(toAction);
};

export default browseAdminActions;
