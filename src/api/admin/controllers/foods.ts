import findFoodIcon from "@/api/food-bank/findFoodIcon";
import resetFoodHistories from "@/api/foodHistories/services/resetFoodHistories";
import createFood from "@/api/foods/services/createFood";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import { AppDataSource } from "@/services/database/datasource";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import UserEntity from "@/entities/UserEntity";
import { In, IsNull } from "typeorm";
import { rankByName } from "../foodSearch";

const MAX_SCAN = 20000;
import { idOf, logAction, NEEDED_BELOW, pageOf, recentActions, text } from "../helpers";

const loadFood = async (id: number) => {
  const food = await AppDataSource.manager.findOne(FoodEntity, { where: { id }, relations: { household: true } });
  if (!food) throw Missing(`Food ${id} not found`);
  return food;
};

const where = (food: FoodEntity) => `${food.name} (${food.household?.name || `household ${food.household?.id}`})`;

export const browseFoods = async ({ query }: Request, res: Response) => {
  const { offset, limit } = pageOf(query);
  const m = AppDataSource.manager;

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

  return res.status(200).json({
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
  });
};

export const readFood = async ({ params }: Request, res: Response) => {
  const id = idOf(params.id);
  const food = await loadFood(id);
  const m = AppDataSource.manager;
  const [histories, lists, next] = await Promise.all([
    m.find(FoodHistoryEntity, { where: { food: { id } }, relations: { user: true }, order: { createdAt: "DESC" }, take: 10 }),
    m.createQueryBuilder(ListEntity, "list").innerJoin("list.foods", "food", "food.id = :id", { id }).getMany(),
    AppDataSource.query(
      `SELECT f.id, f.name, COUNT(*) AS times FROM frequencies q JOIN foods f ON f.id = q.nextBoughtFoodId
       WHERE q.foodId = ? GROUP BY f.id, f.name ORDER BY times DESC LIMIT 5`,
      [id],
    ) as Promise<{ id: number; name: string; times: string | number }[]>,
  ]);

  return res.status(200).json({
    id,
    name: food.name,
    description: food.description ?? "",
    icon: food.icon ?? null,
    inStockScore: food.inStockScore,
    snoozedUntil: food.snoozedUntil ?? null,
    createdAt: food.createdAt,
    household: { id: food.household.id, name: food.household.name ?? null },
    history: histories.map((entry) => ({
      user: entry.user?.username ?? null,
      answer: entry.isInStock === null ? "unsure" : entry.isInStock ? "have" : "need",
      at: entry.createdAt,
    })),
    lists: lists.map((list) => ({ id: list.id, title: list.title, isMain: list.isMain })),
    usuallyNext: next.map((row) => ({ id: Number(row.id), name: row.name, times: Number(row.times) })),
    actions: await recentActions("food", id),
  });
};

export const addFood = async ({ body, user: admin }: Request, res: Response) => {
  const householdId = idOf(body?.householdId, "householdId");
  const name = text(body?.name, "name", { max: 120 })!;
  const description = text(body?.description, "description", { optional: true, max: 2000 });
  const household = await AppDataSource.manager.findOne(HouseholdEntity, { where: { id: householdId } });
  if (!household) throw Missing(`Household ${householdId} not found`);
  const main = await AppDataSource.manager.findOne(ListEntity, { where: { household: { id: householdId }, isMain: true } });
  if (!main) throw ApiError(400, "This household has no main list");
  const food = await createFood(householdId, main.id, { name, description, icon: findFoodIcon(name) });
  await logAction(admin!, "food", food.id, `Added ${name} to ${household.name || `household ${householdId}`}`);
  return res.status(201).json({ id: food.id });
};

export const editFood = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const food = await loadFood(id);
  const changes: Partial<FoodEntity> = {};
  const notes: string[] = [];
  const name = text(body?.name, "name", { optional: true, max: 120 });
  if (name && name !== food.name) {
    changes.name = name;
    notes.push(`renamed to ${name}`);
    if (!(body && "icon" in body)) changes.icon = findFoodIcon(name) ?? null;
  }
  if (body && "description" in body) {
    const description = text(body.description, "description", { optional: true, max: 2000 }) ?? "";
    if (description !== (food.description ?? "")) {
      changes.description = description;
      notes.push("description changed");
    }
  }
  if (body && "icon" in body) {
    const icon = body.icon === null ? null : text(body.icon, "icon", { max: 64 })!;
    if (icon !== (food.icon ?? null)) {
      changes.icon = icon;
      notes.push(`icon → ${icon ?? "none"}`);
    }
  }
  if (notes.length || "icon" in changes) {
    await AppDataSource.manager.update(FoodEntity, id, changes);
    await logAction(admin!, "food", id, `Edited ${where(food)}: ${notes.join(", ") || "icon matched again"}`);
  }
  return res.status(200).json({ changed: notes.length });
};

export const resetFoodScore = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const food = await loadFood(id);
  await doTransaction(async (m) => {
    await resetFoodHistories(id, m);
    await logAction(admin!, "food", id, `Reset the score of ${where(food)}`, m);
  });
  return res.status(200).json({ ok: true });
};

export const unsnoozeFood = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const food = await loadFood(id);
  await AppDataSource.manager.update(FoodEntity, id, { snoozedUntil: null as unknown as Date });
  await logAction(admin!, "food", id, `Cleared "next time" on ${where(food)}`);
  return res.status(200).json({ ok: true });
};

export const matchIcons = async ({ user: admin }: Request, res: Response) => {
  const foods = await AppDataSource.manager.find(FoodEntity, { where: { icon: IsNull() }, select: { id: true, name: true } });
  let matched = 0;
  for (const food of foods) {
    const icon = findFoodIcon(food.name);
    if (!icon) continue;
    await AppDataSource.manager.update(FoodEntity, food.id, { icon });
    matched += 1;
  }
  return res.status(200).json({ checked: foods.length, matched, adminId: admin!.id });
};

export const deleteFood = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const food = await loadFood(id);
  await AppDataSource.manager.delete(FoodEntity, id);
  await logAction(admin!, "food", id, `Deleted ${where(food)}`);
  return res.status(200).json({ ok: true });
};
