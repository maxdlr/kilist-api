import createList from "@/api/lists/services/createList";
import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import { AppDataSource } from "@/services/database/datasource";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { Brackets, In, Not } from "typeorm";
import { idOf, logAction, pageOf, recentActions, text } from "../helpers";

const loadList = async (id: number) => {
  const list = await AppDataSource.manager.findOne(ListEntity, { where: { id }, relations: { foods: true, household: true } });
  if (!list) throw Missing(`List ${id} not found`);
  return list;
};

const label = (list: ListEntity) => `${list.title} (${list.household?.name || `household ${list.household?.id}`})`;

export const browseLists = async ({ query }: Request, res: Response) => {
  const { offset, limit } = pageOf(query);
  const qb = AppDataSource.manager
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
  return res.status(200).json({
    total,
    items: lists.map((list) => ({
      id: list.id,
      title: list.title,
      isMain: list.isMain,
      foods: (list as ListEntity & { foodCount?: number }).foodCount ?? 0,
      household: list.household ? { id: list.household.id, name: list.household.name ?? null } : null,
    })),
  });
};

export const readList = async ({ params }: Request, res: Response) => {
  const id = idOf(params.id);
  const list = await loadList(id);
  const onList = new Set(list.foods.map((food) => food.id));
  const householdFoods = await AppDataSource.manager.find(FoodEntity, {
    where: { household: { id: list.household.id } },
    select: { id: true, name: true },
    order: { name: "ASC" },
  });
  return res.status(200).json({
    id,
    title: list.title,
    isMain: list.isMain,
    household: { id: list.household.id, name: list.household.name ?? null },
    foods: list.foods.map((food) => ({ id: food.id, name: food.name })).sort((a, b) => a.name.localeCompare(b.name)),
    available: householdFoods.filter((food) => !onList.has(food.id)).map((food) => ({ id: food.id, name: food.name })),
    actions: await recentActions("list", id),
  });
};

export const addList = async ({ body, user: admin }: Request, res: Response) => {
  const householdId = idOf(body?.householdId, "householdId");
  const title = text(body?.title, "title", { max: 120 })!;
  if (!(await AppDataSource.manager.exists(HouseholdEntity, { where: { id: householdId } }))) throw Missing(`Household ${householdId} not found`);
  const list = await createList(householdId, { title, isMain: false });
  await logAction(admin!, "list", list.id, `Created ${title}`);
  return res.status(201).json({ id: list.id });
};

export const editList = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const list = await loadList(id);
  const title = text(body?.title, "title", { optional: true, max: 120 });
  await doTransaction(async (m) => {
    if (title && title !== list.title) {
      await m.update(ListEntity, id, { title });
      await logAction(admin!, "list", id, `Renamed ${label(list)} to ${title}`, m);
    }
    if (body?.isMain === true && !list.isMain) {
      await m.update(ListEntity, { household: { id: list.household.id }, id: Not(id) }, { isMain: false });
      await m.update(ListEntity, id, { isMain: true });
      await logAction(admin!, "list", id, `Made ${label(list)} the main list`, m);
    }
  });
  return res.status(200).json({ ok: true });
};

export const addListFoods = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const list = await loadList(id);
  const ids: number[] = Array.isArray(body?.foodIds) ? body.foodIds.map(Number).filter(Number.isInteger) : [];
  if (!ids.length) throw ApiError("foodIds must be a non-empty array");
  const foods = await AppDataSource.manager.find(FoodEntity, { where: { id: In(ids), household: { id: list.household.id } } });
  const fresh = foods.filter((food) => !list.foods.some((entry) => entry.id === food.id));
  if (fresh.length) {
    list.foods = [...list.foods, ...fresh];
    await AppDataSource.manager.save(ListEntity, list);
    await logAction(admin!, "list", id, `Added ${fresh.map((food) => food.name).join(", ")} to ${label(list)}`);
  }
  return res.status(200).json({ added: fresh.length });
};

export const removeListFood = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const foodId = idOf(params.foodId, "food id");
  const list = await loadList(id);
  const food = list.foods.find((entry) => entry.id === foodId);
  if (!food) throw Missing(`Food ${foodId} is not on this list`);
  await AppDataSource.manager.createQueryBuilder().relation(ListEntity, "foods").of(id).remove(foodId);
  await logAction(admin!, "list", id, `Removed ${food.name} from ${label(list)}`);
  return res.status(200).json({ ok: true });
};

export const deleteList = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const list = await loadList(id);
  if (list.isMain) throw ApiError(400, "Make another list the main one first");
  await AppDataSource.manager.delete(ListEntity, id);
  await logAction(admin!, "list", id, `Deleted ${label(list)}`);
  return res.status(200).json({ ok: true });
};
