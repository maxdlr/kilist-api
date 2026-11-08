import HouseholdEntity from "@/entities/HouseholdEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { Brackets, EntityManager } from "typeorm";
import { NEEDED_BELOW, pageOf } from "../../helpers";
import lastActiveByHousehold from "./lastActiveByHousehold";

const countsBy = async (m: EntityManager, sql: string, ids: number[]) => {
  if (!ids.length) return new Map<number, number>();
  const rows: { id: number; total: number | string }[] = await m.query(sql, [ids]);
  return new Map(rows.map((row) => [Number(row.id), Number(row.total)]));
};

const browseAdminHouseholds = async (query: Record<string, unknown>, manager?: EntityManager) => {
  const m = findManager(HouseholdRepository, manager);
  const { offset, limit } = pageOf(query);
  const qb = m.createQueryBuilder(HouseholdEntity, "household").orderBy("household.id", "DESC");
  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    qb.andWhere(
      new Brackets((where) =>
        where.where("household.name LIKE :search", { search: `%${search}%` }).orWhere("household.joinCode = :code", { code: search.toUpperCase() }),
      ),
    );
  }
  const [households, total] = await qb.skip(offset).take(limit).getManyAndCount();
  const ids = households.map((household) => household.id);
  const [members, foods, needed, lastActive] = await Promise.all([
    countsBy(m, "SELECT householdId AS id, COUNT(*) AS total FROM users WHERE householdId IN (?) GROUP BY householdId", ids),
    countsBy(m, "SELECT householdId AS id, COUNT(*) AS total FROM foods WHERE householdId IN (?) AND deletedAt IS NULL GROUP BY householdId", ids),
    countsBy(m, `SELECT householdId AS id, COUNT(*) AS total FROM foods WHERE householdId IN (?) AND deletedAt IS NULL AND inStockScore < ${NEEDED_BELOW} GROUP BY householdId`, ids),
    lastActiveByHousehold(ids, m),
  ]);

  return {
    total,
    items: households.map((household) => ({
      id: household.id,
      name: household.name ?? null,
      joinCode: household.joinCode,
      members: members.get(household.id) ?? 0,
      foods: foods.get(household.id) ?? 0,
      needed: needed.get(household.id) ?? 0,
      lastActive: lastActive.get(household.id) ?? null,
    })),
  };
};

export default browseAdminHouseholds;
