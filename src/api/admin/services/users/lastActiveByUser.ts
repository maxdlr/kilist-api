import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const lastActiveByUser = async (userIds: number[], manager?: EntityManager) => {
  if (!userIds.length) return new Map<number, Date>();
  const rows: { userId: number; last: Date | string | null }[] = await findManager(UserRepository, manager).query(
    `SELECT userId, MAX(at) AS last FROM (
       SELECT userId, createdAt AS at FROM food_histories WHERE userId IN (?)
       UNION ALL SELECT userId, createdAt FROM \`shop-list\` WHERE userId IN (?)
       UNION ALL SELECT userId, createdAt FROM race_runs WHERE userId IN (?)
     ) activity GROUP BY userId`,
    [userIds, userIds, userIds],
  );
  return new Map(rows.filter((row) => row.last).map((row) => [Number(row.userId), new Date(row.last!)]));
};

export default lastActiveByUser;
