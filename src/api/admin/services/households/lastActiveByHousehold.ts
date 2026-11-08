import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const lastActiveByHousehold = async (ids: number[], manager?: EntityManager) => {
  if (!ids.length) return new Map<number, Date>();
  const rows: { id: number; last: string | Date | null }[] = await findManager(HouseholdRepository, manager).query(
    `SELECT f.householdId AS id, MAX(h.createdAt) AS last FROM food_histories h
     JOIN foods f ON f.id = h.foodId WHERE f.householdId IN (?) GROUP BY f.householdId`,
    [ids],
  );
  return new Map(rows.filter((row) => row.last).map((row) => [Number(row.id), new Date(row.last!)]));
};

export default lastActiveByHousehold;
