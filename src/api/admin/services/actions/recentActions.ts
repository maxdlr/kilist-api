import AdminActionEntity, { AdminTarget } from "@/entities/AdminActionEntity";
import AdminActionRepository from "@/repositories/AdminActionRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import { toAction } from "../../helpers";

const recentActions = async (
  targetType: AdminTarget,
  targetId: number,
  manager?: EntityManager,
  take = 10,
) => {
  const rows = await findManager(AdminActionRepository, manager).find(AdminActionEntity, {
    where: { targetType, targetId },
    relations: { admin: true },
    order: { createdAt: "DESC", id: "DESC" },
    take,
  });
  return rows.map(toAction);
};

export default recentActions;
