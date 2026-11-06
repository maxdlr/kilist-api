import FoodEntity from "@/entities/FoodEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { EntityManager, IsNull, Not } from "typeorm";
import { householdMembers } from "./race";

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
