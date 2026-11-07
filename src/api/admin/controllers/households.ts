import createHousehold from "@/api/households/services/createHousehold";
import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import RaceEntity from "@/entities/RaceEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import doTransaction from "@/utils/doTransaction";
import generateJoinCode from "@/utils/generateJoinCode";
import { Request, Response } from "express";
import { Brackets, LessThan } from "typeorm";
import { idOf, logAction, NEEDED_BELOW, pageOf, recentActions, text } from "../helpers";

const labelOf = (household: HouseholdEntity) => household.name || `Household ${household.id}`;

const loadHousehold = async (id: number) => {
  const household = await AppDataSource.manager.findOne(HouseholdEntity, { where: { id } });
  if (!household) throw Missing(`Household ${id} not found`);
  return household;
};

const countsBy = async (sql: string, ids: number[]) => {
  if (!ids.length) return new Map<number, number>();
  const rows: { id: number; total: number | string }[] = await AppDataSource.query(sql, [ids]);
  return new Map(rows.map((row) => [Number(row.id), Number(row.total)]));
};

const lastActiveByHousehold = async (ids: number[]) => {
  if (!ids.length) return new Map<number, Date>();
  const rows: { id: number; last: string | Date | null }[] = await AppDataSource.query(
    `SELECT f.householdId AS id, MAX(h.createdAt) AS last FROM food_histories h
     JOIN foods f ON f.id = h.foodId WHERE f.householdId IN (?) GROUP BY f.householdId`,
    [ids],
  );
  return new Map(rows.filter((row) => row.last).map((row) => [Number(row.id), new Date(row.last!)]));
};

export const browseHouseholds = async ({ query }: Request, res: Response) => {
  const { offset, limit } = pageOf(query);
  const qb = AppDataSource.manager.createQueryBuilder(HouseholdEntity, "household").orderBy("household.id", "DESC");
  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    qb.andWhere(
      new Brackets((where) =>
        where.where("household.name LIKE :search", { search: `%${search}%` }).orWhere("household.joinCode = :code", { code: search.toUpperCase() }),
      ),
    );
  }
  const [households, total] = await qb.skip(offset).take(limit).getManyAndCount();
  const ids = households.map((household) => household.id);
  const [members, foods, needed, lastActive] = await Promise.all([
    countsBy("SELECT householdId AS id, COUNT(*) AS total FROM users WHERE householdId IN (?) GROUP BY householdId", ids),
    countsBy("SELECT householdId AS id, COUNT(*) AS total FROM foods WHERE householdId IN (?) AND deletedAt IS NULL GROUP BY householdId", ids),
    countsBy(`SELECT householdId AS id, COUNT(*) AS total FROM foods WHERE householdId IN (?) AND deletedAt IS NULL AND inStockScore < ${NEEDED_BELOW} GROUP BY householdId`, ids),
    lastActiveByHousehold(ids),
  ]);

  return res.status(200).json({
    total,
    items: households.map((household) => ({
      id: household.id,
      name: household.name ?? null,
      joinCode: household.joinCode,
      members: members.get(household.id) ?? 0,
      foods: foods.get(household.id) ?? 0,
      needed: needed.get(household.id) ?? 0,
      lastActive: lastActive.get(household.id) ?? null,
    })),
  });
};

export const readHousehold = async ({ params }: Request, res: Response) => {
  const id = idOf(params.id);
  const household = await loadHousehold(id);
  const m = AppDataSource.manager;
  const [members, lists, foods, needed, trips, lastTrip, races, lastRace, lastActive] = await Promise.all([
    m.find(UserEntity, { where: { household: { id } }, order: { id: "ASC" } }),
    m.find(ListEntity, { where: { household: { id } }, relations: { foods: true }, order: { id: "ASC" } }),
    m.count(FoodEntity, { where: { household: { id } } }),
    m.count(FoodEntity, { where: { household: { id }, inStockScore: LessThan(NEEDED_BELOW) } }),
    m.count(ShopListEntity, { where: { household: { id } } }),
    m.findOne(ShopListEntity, { where: { household: { id } }, order: { createdAt: "DESC" } }),
    m.count(RaceEntity, { where: { household: { id } } }),
    m.findOne(RaceEntity, { where: { household: { id } }, order: { createdAt: "DESC" } }),
    lastActiveByHousehold([id]),
  ]);

  return res.status(200).json({
    id,
    name: household.name ?? null,
    joinCode: household.joinCode,
    createdAt: household.createdAt,
    lastActive: lastActive.get(id) ?? null,
    members: members.map((member) => ({ id: member.id, username: member.username, email: member.email, type: member.type })),
    lists: lists.map((list) => ({ id: list.id, title: list.title, isMain: list.isMain, foods: list.foods.length })),
    foods,
    needed,
    trips: { count: trips, last: lastTrip?.createdAt ?? null },
    races: { count: races, last: lastRace?.createdAt ?? null },
    actions: await recentActions("household", id),
  });
};

export const addHousehold = async ({ body, user: admin }: Request, res: Response) => {
  const name = text(body?.name, "name", { optional: true, max: 64 });
  const household = await createHousehold(name);
  await logAction(admin!, "household", household.id, `Created ${labelOf(household)}`);
  return res.status(201).json({ id: household.id });
};

export const renameHousehold = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const household = await loadHousehold(id);
  const name = text(body?.name, "name", { max: 64 })!;
  await AppDataSource.manager.update(HouseholdEntity, id, { name });
  await logAction(admin!, "household", id, `Renamed ${labelOf(household)} to ${name}`);
  return res.status(200).json({ name });
};

export const newJoinCode = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const household = await loadHousehold(id);
  let joinCode = generateJoinCode();
  while (await AppDataSource.manager.exists(HouseholdEntity, { where: { joinCode } })) joinCode = generateJoinCode();
  await AppDataSource.manager.update(HouseholdEntity, id, { joinCode });
  await logAction(admin!, "household", id, `New join code for ${labelOf(household)} (was ${household.joinCode})`);
  return res.status(200).json({ joinCode });
};

export const addMember = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const household = await loadHousehold(id);
  const email = text(body?.email, "email")!.toLowerCase();
  const user = await AppDataSource.manager
    .createQueryBuilder(UserEntity, "user")
    .leftJoinAndSelect("user.household", "household")
    .where("LOWER(user.email) = :email", { email })
    .getOne();
  if (!user) throw ApiError(404, `No account uses ${email}`);
  if (user.household?.id === id) throw UserError(400, "household.alreadyMember");

  await doTransaction(async (m) => {
    await m.update(UserEntity, user.id, { household: { id } as HouseholdEntity });
    await logAction(admin!, "household", id, `Added ${user.username}`, m);
    await logAction(admin!, "user", user.id, `Moved ${user.username} to ${labelOf(household)}`, m);
    if (user.household) await logAction(admin!, "household", user.household.id, `Moved ${user.username} out`, m);
  });
  return res.status(200).json({ userId: user.id });
};

export const removeMember = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const userId = idOf(params.userId, "user id");
  const household = await loadHousehold(id);
  const user = await AppDataSource.manager.findOne(UserEntity, { where: { id: userId, household: { id } } });
  if (!user) throw Missing(`User ${userId} is not in this household`);

  const own = await doTransaction(async (m) => {
    const fresh = await createHousehold(user.username, m);
    await m.update(UserEntity, userId, { household: { id: fresh.id } as HouseholdEntity });
    await logAction(admin!, "household", id, `Removed ${user.username}`, m);
    await logAction(admin!, "user", userId, `Removed from ${labelOf(household)}, moved to a new household`, m);
    return fresh;
  });
  return res.status(200).json({ householdId: own.id });
};

export const deleteHousehold = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const household = await loadHousehold(id);
  const members = await AppDataSource.manager.count(UserEntity, { where: { household: { id } } });
  if (members > 0) throw ApiError(400, "Remove every member first");

  await doTransaction(async (m) => {
    const lists = await m.find(ListEntity, { where: { household: { id } }, select: { id: true } });
    if (lists.length) await m.delete(ListEntity, lists.map((list) => list.id));
    await m.delete(HouseholdEntity, id);
    await logAction(admin!, "household", id, `Deleted ${labelOf(household)}`, m);
  });
  return res.status(200).json({ ok: true });
};
