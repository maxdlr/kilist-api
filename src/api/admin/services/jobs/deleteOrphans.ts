import removeHouseholdIfEmpty from "@/api/households/services/removeHouseholdIfEmpty";
import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const deleteOrphans = async (dryRun: boolean, manager?: EntityManager) => {
  const m = findManager(HouseholdRepository, manager);

  const households = await m
    .createQueryBuilder(HouseholdEntity, "household")
    .leftJoin("household.members", "member")
    .where("member.id IS NULL")
    .select("household.id", "id")
    .getRawMany<{ id: number }>();

  const strayFoods = await m
    .createQueryBuilder(FoodEntity, "food")
    .leftJoin("food.household", "household")
    .where("household.id IS NULL")
    .select("food.id", "id")
    .getRawMany<{ id: number }>();

  const strayLists = await m
    .createQueryBuilder(ListEntity, "list")
    .leftJoin("list.household", "household")
    .where("household.id IS NULL")
    .select("list.id", "id")
    .getRawMany<{ id: number }>();

  const householdIds = households.map((row) => Number(row.id));
  const ownedFoods = householdIds.length
    ? await m
        .createQueryBuilder(FoodEntity, "food")
        .where("food.household IN (:...householdIds)", { householdIds })
        .getCount()
    : 0;

  if (!dryRun) {
    for (const id of householdIds) await removeHouseholdIfEmpty(id, m);
    if (strayFoods.length) {
      await m.softDelete(
        FoodEntity,
        strayFoods.map((row) => Number(row.id)),
      );
    }
    if (strayLists.length) {
      await m.softDelete(
        ListEntity,
        strayLists.map((row) => Number(row.id)),
      );
    }
  }

  const foods = ownedFoods + strayFoods.length;

  return {
    affected: householdIds.length + foods + strayLists.length,
    summary: `${plural(householdIds.length, "household", "households")} with no member, ${plural(foods, "food", "foods")} and ${plural(strayLists.length, "list", "lists")} with no household ${dryRun ? "would be" : "were"} marked as deleted.`,
  };
};

export default deleteOrphans;
