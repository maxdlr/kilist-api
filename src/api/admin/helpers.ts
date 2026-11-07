import AdminActionEntity, { AdminTarget } from "@/entities/AdminActionEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { EntityManager } from "typeorm";

export const NEEDED_BELOW = 0.375;
export const PAGE_SIZE = 50;

export const idOf = (value: unknown, name = "id") => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw ApiError(`A valid ${name} is required`);
  return id;
};

export const text = (value: unknown, name: string, { optional = false, max = 255 } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (optional) return undefined;
    throw ApiError(`${name} is required`);
  }
  if (typeof value !== "string" || value.trim().length > max) throw ApiError(`${name} must be text up to ${max} characters`);
  return value.trim();
};

export const pageOf = (query: Record<string, unknown>) => {
  const offset = Math.max(0, Number(query.offset) || 0);
  return { offset, limit: PAGE_SIZE };
};

export const logAction = (
  admin: UserEntity,
  targetType: AdminTarget,
  targetId: number,
  summary: string,
  manager?: EntityManager,
) =>
  (manager ?? AppDataSource.manager).save(AdminActionEntity, {
    admin: { id: admin.id } as UserEntity,
    targetType,
    targetId,
    summary: summary.slice(0, 500),
  });

export const recentActions = async (targetType: AdminTarget, targetId: number, take = 10) => {
  const rows = await AppDataSource.manager.find(AdminActionEntity, {
    where: { targetType, targetId },
    relations: { admin: true },
    order: { createdAt: "DESC", id: "DESC" },
    take,
  });
  return rows.map(toAction);
};

export const toAction = (row: AdminActionEntity) => ({
  id: row.id,
  summary: row.summary,
  admin: row.admin?.username ?? null,
  targetType: row.targetType,
  targetId: row.targetId,
  at: row.createdAt,
});

export const lastActiveByUser = async (userIds: number[]) => {
  if (!userIds.length) return new Map<number, Date>();
  const rows: { userId: number; last: Date | string | null }[] = await AppDataSource.query(
    `SELECT userId, MAX(at) AS last FROM (
       SELECT userId, createdAt AS at FROM food_histories WHERE userId IN (?)
       UNION ALL SELECT userId, createdAt FROM \`shop-list\` WHERE userId IN (?)
       UNION ALL SELECT userId, createdAt FROM race_runs WHERE userId IN (?)
     ) activity GROUP BY userId`,
    [userIds, userIds, userIds],
  );
  return new Map(rows.filter((row) => row.last).map((row) => [Number(row.userId), new Date(row.last!)]));
};
