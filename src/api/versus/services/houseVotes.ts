import UserEntity from "@/entities/UserEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import householdMembers from "./householdMembers";

const houseVotes = async (user: UserEntity, manager?: EntityManager) => {
  const m = findManager(FoodHistoryRepository, manager);
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

export default houseVotes;
