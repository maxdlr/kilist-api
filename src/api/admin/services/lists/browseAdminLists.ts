import ListEntity from "@/entities/ListEntity";
import ListRepository from "@/repositories/ListRepository";
import findManager from "@/utils/findManager";
import { Brackets, EntityManager } from "typeorm";
import { pageOf } from "../../helpers";

const browseAdminLists = async (query: Record<string, unknown>, manager?: EntityManager) => {
  const { offset, limit } = pageOf(query);
  const qb = findManager(ListRepository, manager)
    .createQueryBuilder(ListEntity, "list")
    .leftJoinAndSelect("list.household", "household")
    .loadRelationCountAndMap("list.foodCount", "list.foods")
    .orderBy("household.id", "DESC")
    .addOrderBy("list.isMain", "DESC");
  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    qb.andWhere(
      new Brackets((where) =>
        where.where("list.title LIKE :search", { search: `%${search}%` }).orWhere("household.name LIKE :search"),
      ),
    );
  }
  if (query.householdId) qb.andWhere("household.id = :householdId", { householdId: Number(query.householdId) });
  const [lists, total] = await qb.skip(offset).take(limit).getManyAndCount();
  return {
    total,
    items: lists.map((list) => ({
      id: list.id,
      title: list.title,
      isMain: list.isMain,
      foods: (list as ListEntity & { foodCount?: number }).foodCount ?? 0,
      household: list.household ? { id: list.household.id, name: list.household.name ?? null } : null,
    })),
  };
};

export default browseAdminLists;
