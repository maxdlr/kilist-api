import AdminActionEntity, { AdminTarget } from "@/entities/AdminActionEntity";
import UserEntity from "@/entities/UserEntity";
import AdminActionRepository from "@/repositories/AdminActionRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const logAction = (
  admin: UserEntity,
  targetType: AdminTarget,
  targetId: number,
  summary: string,
  manager?: EntityManager,
) =>
  findManager(AdminActionRepository, manager).save(AdminActionEntity, {
    admin: { id: admin.id } as UserEntity,
    targetType,
    targetId,
    summary: summary.slice(0, 500),
  });

export default logAction;
