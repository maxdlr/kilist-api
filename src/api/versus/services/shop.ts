import FoodEntity from "@/entities/FoodEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { EntityManager, IsNull, Not } from "typeorm";
import { householdMembers } from "./race";

const TIP_LOOKBACK = 10;
const TIP_MIN_COUNT = 2;
const TIP_MIN_SHARE = 0.6;

export const shopRuns = async (householdId: number, m: EntityManager) => {
  const lists = await m.find(ShopListEntity, {
    where: { household: { id: householdId }, endedAt: Not(IsNull()), user: Not(IsNull()) },
    relations: { user: true, boughtFoods: true },
    order: { id: "ASC" },
  });

  return lists
    .filter((list) => (list.boughtFoods as FoodEntity[]).length > 0 && list.createdAt && list.endedAt)
    .map((list) => {
      const start = list.createdAt!.getTime();
      return {
        id: list.id,
        userId: list.user!.id,
        username: list.user!.username,
        ms: Math.max(0, list.endedAt!.getTime() - start),
        items: (list.boughtFoods as FoodEntity[]).length,
        foodIds: (list.boughtFoods as FoodEntity[]).map((food) => food.id),
        splits: (list.buyLog ?? [])
          .map((entry) => Date.parse(entry.at) - start)
          .filter((split) => split >= 0)
          .sort((a, b) => a - b),
        endedAt: list.endedAt!,
      };
    });
};

export const shopRecords = async (user: UserEntity) => {
  const runs = await shopRuns(user.household.id, AppDataSource.manager);
  const fastest = (list: typeof runs) =>
    list.reduce<(typeof runs)[number] | null>((best, run) => (!best || run.ms < best.ms ? run : best), null);
  const strip = (run: (typeof runs)[number] | null) =>
    run && {
      userId: run.userId,
      username: run.username,
      ms: run.ms,
      items: run.items,
      splits: run.splits,
      endedAt: run.endedAt,
    };

  return {
    houseRecord: strip(fastest(runs)),
    myBest: strip(fastest(runs.filter((run) => run.userId === user.id))),
    runsByMember: Object.fromEntries(
      [...new Set(runs.map((run) => run.userId))].map((id) => [id, runs.filter((run) => run.userId === id).length]),
    ),
  };
};

export const shopTip = async (user: UserEntity, shopListId: number, afterFoodId: number) => {
  const m = AppDataSource.manager;
  const householdId = user.household.id;
  const current = await m.findOne(ShopListEntity, {
    where: { id: shopListId, household: { id: householdId } },
    relations: { boughtFoods: true, startFoods: true },
  });
  if (!current) throw Missing(`Shop list ${shopListId} not found`);

  const runs = (await shopRuns(householdId, m)).filter((run) => run.id !== shopListId);
  const members = await householdMembers(householdId, m);
  const mates = members.filter((member) => member.id !== user.id);
  const busiestMate = mates
    .map((mate) => ({ mate, count: runs.filter((run) => run.userId === mate.id).length }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)[0]?.mate;
  const source = busiestMate ?? members.find((member) => member.id === user.id)!;

  const withFood = runs
    .filter((run) => run.userId === source.id && run.foodIds.includes(afterFoodId))
    .slice(-TIP_LOOKBACK);
  if (withFood.length < TIP_MIN_COUNT) return null;

  const already = new Set((current.boughtFoods as FoodEntity[]).map((food) => food.id));
  already.add(afterFoodId);
  const counts = new Map<number, number>();
  for (const run of withFood) {
    for (const foodId of run.foodIds) {
      if (already.has(foodId)) continue;
      counts.set(foodId, (counts.get(foodId) ?? 0) + 1);
    }
  }

  const [foodId, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!foodId || !count || count < TIP_MIN_COUNT || count / withFood.length < TIP_MIN_SHARE) return null;

  const food = await m.findOne(FoodEntity, { where: { id: foodId, household: { id: householdId } } });
  if (!food) return null;

  return {
    userId: source.id,
    username: source.username,
    isSelf: source.id === user.id,
    food,
    afterFoodId,
    count,
    of: withFood.length,
  };
};

export const houseVotes = async (user: UserEntity) => {
  const m = AppDataSource.manager;
  const members = await householdMembers(user.household.id, m);
  const rows = await m
    .createQueryBuilder()
    .select(["history.foodId AS foodId", "history.userId AS userId", "history.isInStock AS isInStock", "history.createdAt AS createdAt"])
    .from("food_histories", "history")
    .innerJoin("foods", "food", "food.id = history.foodId")
    .where("food.householdId = :householdId", { householdId: user.household.id })
    .andWhere("history.userId IS NOT NULL")
    .andWhere("history.deletedAt IS NULL")
    .orderBy("history.createdAt", "ASC")
    .addOrderBy("history.id", "ASC")
    .getRawMany<{ foodId: number; userId: number; isInStock: number | null; createdAt: Date }>();

  const votes: Record<number, Record<number, { answer: "in" | "out" | "up"; at: Date }>> = {};
  for (const row of rows) {
    const answer = row.isInStock === null ? "up" : Number(row.isInStock) ? "in" : "out";
    votes[row.foodId] = { ...(votes[row.foodId] ?? {}), [row.userId]: { answer, at: row.createdAt } };
  }

  return { members, votes };
};
