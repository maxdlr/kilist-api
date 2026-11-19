import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import ListEntity from "@/entities/ListEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import recentActions from "../actions/recentActions";
import loadFood from "./loadFood";
import { explainScore } from "@/api/foods/scoring";

const readAdminFood = async (id: number, manager?: EntityManager) => {
  const m = findManager(FoodRepository, manager);
  const food = await loadFood(id, m);
  const [histories, answers, lists, next] = await Promise.all([
    m.find(FoodHistoryEntity, { where: { food: { id } }, relations: { user: true }, order: { createdAt: "DESC" }, take: 10 }),
    m.find(FoodHistoryEntity, { where: { food: { id } }, select: { isInStock: true, createdAt: true } }),
    m.createQueryBuilder(ListEntity, "list").innerJoin("list.foods", "food", "food.id = :id", { id }).getMany(),
    m.query(
      `SELECT f.id, f.name, COUNT(*) AS times FROM frequencies q JOIN foods f ON f.id = q.nextBoughtFoodId
       WHERE q.foodId = ? GROUP BY f.id, f.name ORDER BY times DESC LIMIT 5`,
      [id],
    ) as Promise<{ id: number; name: string; times: string | number }[]>,
  ]);

  return {
    id,
    name: food.name,
    description: food.description ?? "",
    icon: food.icon ?? null,
    inStockScore: food.inStockScore,
    snoozedUntil: food.snoozedUntil ?? null,
    frequencyDays: food.frequencyDays ?? null,
    scoring: explainScore(
      food,
      answers.map((answer) => ({ isInStock: answer.isInStock, at: answer.createdAt ?? new Date() })),
    ),
    createdAt: food.createdAt,
    household: { id: food.household.id, name: food.household.name ?? null },
    history: histories.map((entry) => ({
      user: entry.user?.username ?? null,
      answer: entry.isInStock === null ? "unsure" : entry.isInStock ? "have" : "need",
      at: entry.createdAt,
    })),
    lists: lists.map((list) => ({ id: list.id, title: list.title, isMain: list.isMain })),
    usuallyNext: next.map((row) => ({ id: Number(row.id), name: row.name, times: Number(row.times) })),
    actions: await recentActions("food", id, m),
  };
};

export default readAdminFood;
