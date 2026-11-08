import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In } from "typeorm";
import { idOf, NEEDED_BELOW, pageOf, rankByName } from "../../helpers";

const MAX_SCAN = 20000;

const browseAdminFoods = async (query: Record<string, unknown>, manager?: EntityManager) => {
  const { offset, limit } = pageOf(query);
  const m = findManager(FoodRepository, manager);

  let householdId = query.householdId ? idOf(query.householdId, "householdId") : undefined;
  let user: UserEntity | null = null;
  if (query.userId) {
    user = await m.findOne(UserEntity, { where: { id: idOf(query.userId, "userId") }, relations: { household: true } });
    if (!user) throw Missing(`User ${query.userId} not found`);
    householdId = user.household.id;
  }
  const household = householdId ? await m.findOne(HouseholdEntity, { where: { id: householdId } }) : null;
  if (householdId && !household) throw Missing(`Household ${householdId} not found`);

  const qb = m.createQueryBuilder(FoodEntity, "food").leftJoin("food.household", "household").select(["food.id", "food.name"]);
  if (householdId) qb.andWhere("household.id = :householdId", { householdId });
  if (query.needed === "1") qb.andWhere(`food.inStockScore < ${NEEDED_BELOW}`);
  if (query.noIcon === "1") qb.andWhere("food.icon IS NULL");
  if (query.snoozed === "1") qb.andWhere("food.snoozedUntil > NOW()");
  qb.orderBy("household.id", "DESC").addOrderBy("food.name", "ASC").limit(MAX_SCAN);

  const search = typeof query.search === "string" ? query.search.trim() : "";
  const candidates = await qb.getMany();
  const matches = search ? rankByName(candidates, search) : candidates;
  const pageIds = matches.slice(offset, offset + limit).map((food) => food.id);
  const rows = pageIds.length
    ? await m.find(FoodEntity, { where: { id: In(pageIds) }, relations: { household: true } })
    : [];
  const byId = new Map(rows.map((food) => [food.id, food]));

  return {
    total: matches.length,
    scope: household
      ? { household: { id: household.id, name: household.name ?? null }, user: user ? { id: user.id, username: user.username } : null }
      : null,
    items: pageIds
      .map((id) => byId.get(id)!)
      .filter(Boolean)
      .map((food) => ({
        id: food.id,
        name: food.name,
        icon: food.icon ?? null,
        inStockScore: food.inStockScore,
        snoozedUntil: food.snoozedUntil ?? null,
        household: food.household ? { id: food.household.id, name: food.household.name ?? null } : null,
      })),
  };
};

export default browseAdminFoods;
