import revokeAllRefreshTokenByUserId from "@/api/auth/services/revokeAllRefreshTokenByUserId";
import createHousehold from "@/api/households/services/createHousehold";
import { PRIZES } from "@/api/prizes/catalog";
import { ticketBalance } from "@/api/prizes/services/tickets";
import createUser from "@/api/users/services/createUser";
import removeUser from "@/api/users/services/removeUser";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import { isLang } from "@/i18n";
import { AppDataSource } from "@/services/database/datasource";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { Brackets, IsNull, MoreThan } from "typeorm";
import { idOf, lastActiveByUser, logAction, pageOf, recentActions, text } from "../helpers";

const SKIN_PRIZES = PRIZES.filter((prize) => prize.kind === "skin");
const skinName = (skin: string) => skin.charAt(0).toUpperCase() + skin.slice(1);

const loadUser = async (id: number) => {
  const user = await AppDataSource.manager.findOne(UserEntity, { where: { id }, relations: { household: true } });
  if (!user) throw Missing(`User ${id} not found`);
  return user;
};

export const browseUsers = async ({ query }: Request, res: Response) => {
  const { offset, limit } = pageOf(query);
  const qb = AppDataSource.manager
    .createQueryBuilder(UserEntity, "user")
    .leftJoinAndSelect("user.household", "household")
    .orderBy("user.id", "DESC");

  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    qb.andWhere(
      new Brackets((where) =>
        where.where("user.username LIKE :search", { search: `%${search}%` }).orWhere("user.email LIKE :search"),
      ),
    );
  }
  if (query.admin === "1") qb.andWhere("user.type = 'admin'");
  if (typeof query.skin === "string" && query.skin) qb.andWhere("user.skin = :skin", { skin: query.skin });
  if (query.language === "auto") qb.andWhere("user.language IS NULL");
  else if (isLang(query.language)) qb.andWhere("user.language = :language", { language: query.language });
  if (query.householdId) qb.andWhere("household.id = :householdId", { householdId: Number(query.householdId) });

  const [users, total] = await qb.skip(offset).take(limit).getManyAndCount();
  const lastActive = await lastActiveByUser(users.map((user) => user.id));

  return res.status(200).json({
    total,
    items: users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      type: user.type,
      skin: user.skin,
      language: user.language,
      deviceLanguage: user.deviceLanguage,
      household: user.household ? { id: user.household.id, name: user.household.name ?? null } : null,
      lastActive: lastActive.get(user.id) ?? null,
    })),
  });
};

export const readUser = async ({ params }: Request, res: Response) => {
  const id = idOf(params.id);
  const user = await loadUser(id);
  const m = AppDataSource.manager;
  const householdId = user.household.id;

  const [answers, trips, points, unlocks, sessions, lastActive, members, foods, lists, householdTrips] = await Promise.all([
    m.count(FoodHistoryEntity, { where: { user: { id } } }),
    m.count(ShopListEntity, { where: { user: { id } } }),
    ticketBalance(id),
    m.find(UnlockEntity, { where: { user: { id } }, order: { createdAt: "ASC" } }),
    m.count(RefreshTokenEntity, { where: { userId: id, revokedOn: IsNull(), expireOn: MoreThan(new Date()) } }),
    lastActiveByUser([id]),
    m.count(UserEntity, { where: { household: { id: householdId } } }),
    m.count(FoodEntity, { where: { household: { id: householdId } } }),
    m.count(ListEntity, { where: { household: { id: householdId } } }),
    m.count(ShopListEntity, { where: { household: { id: householdId } } }),
  ]);

  return res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    type: user.type,
    skin: user.skin,
    language: user.language,
    deviceLanguage: user.deviceLanguage,
    createdAt: user.createdAt,
    lastActive: lastActive.get(id) ?? null,
    stats: { answers, trips, points, sessions },
    household: { id: householdId, name: user.household.name ?? null, members, foods, lists, trips: householdTrips },
    unlocks: unlocks.map((unlock) => ({ prizeId: unlock.prizeId, source: unlock.source, at: unlock.createdAt })),
    skins: SKIN_PRIZES.map((prize) => ({
      prizeId: prize.id,
      skin: prize.skin,
      name: skinName(prize.skin),
      price: prize.price,
      owned: prize.price === 0 || unlocks.some((unlock) => unlock.prizeId === prize.id),
    })),
    actions: await recentActions("user", id),
  });
};

export const addUser = async ({ body, user: admin }: Request, res: Response) => {
  const username = text(body?.username, "username", { max: 64 })!;
  const email = text(body?.email, "email")!.toLowerCase();
  const password = text(body?.password, "password", { max: 128 })!;
  const joinCode = text(body?.joinCode, "joinCode", { optional: true, max: 16 });

  const created = await createUser(
    joinCode
      ? { username, email, password, householdChoice: "join", joinCode: joinCode.toUpperCase() }
      : { username, email, password, householdChoice: "create", householdName: text(body?.householdName, "householdName", { optional: true, max: 64 }) },
  );
  await logAction(admin!, "user", created.id, `Created ${username} (${email})`);
  return res.status(201).json({ id: created.id });
};

export const editUser = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const user = await loadUser(id);
  const changes: Partial<UserEntity> = {};
  const notes: string[] = [];

  const username = text(body?.username, "username", { optional: true, max: 64 });
  if (username && username !== user.username) {
    if (await AppDataSource.manager.exists(UserEntity, { where: { username } })) throw UserError(400, "auth.userExists");
    changes.username = username;
    notes.push(`name ${user.username} → ${username}`);
  }
  const email = text(body?.email, "email", { optional: true })?.toLowerCase();
  if (email && email !== user.email) {
    if (await AppDataSource.manager.exists(UserEntity, { where: { email } })) throw UserError(400, "auth.userExists");
    changes.email = email;
    notes.push(`email → ${email}`);
  }
  if (body && "language" in body) {
    const language = body.language ?? null;
    if (language !== null && !isLang(language)) throw ApiError("language must be a supported code or null");
    if (language !== user.language) {
      changes.language = language;
      notes.push(`language → ${language ?? "phone"}`);
    }
  }

  if (notes.length) {
    await AppDataSource.manager.update(UserEntity, id, changes);
    await logAction(admin!, "user", id, `Edited ${user.username}: ${notes.join(", ")}`);
  }
  return res.status(200).json({ changed: notes.length });
};

export const setAdmin = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const makeAdmin = body?.admin === true;
  if (id === admin!.id && !makeAdmin) throw ApiError(400, "You can't remove your own admin role");
  const user = await loadUser(id);
  await AppDataSource.manager.update(UserEntity, id, { type: makeAdmin ? "admin" : "user" });
  await logAction(admin!, "user", id, `${makeAdmin ? "Made" : "Removed admin role from"} ${user.username}${makeAdmin ? " admin" : ""}`);
  return res.status(200).json({ type: makeAdmin ? "admin" : "user" });
};

export const unlockSkin = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const prize = SKIN_PRIZES.find((entry) => entry.id === body?.prizeId && entry.price > 0);
  if (!prize) throw ApiError("Pick a premium skin");
  const user = await loadUser(id);
  const owned = await AppDataSource.manager.exists(UnlockEntity, { where: { user: { id }, prizeId: prize.id } });
  if (owned) throw ApiError(409, `${user.username} already has ${skinName(prize.skin)}`);
  const wear = body?.wear === true;
  await doTransaction(async (m) => {
    await m.save(UnlockEntity, { user: { id } as UserEntity, prizeId: prize.id, source: "gift" });
    if (wear) await m.update(UserEntity, id, { skin: prize.skin });
    await logAction(admin!, "user", id, `Unlocked ${skinName(prize.skin)} for ${user.username}${wear ? " and switched them to it" : ""}`, m);
  });
  return res.status(201).json({ prizeId: prize.id });
};

export const setSkin = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const prize = SKIN_PRIZES.find((entry) => entry.skin === body?.skin);
  if (!prize) throw ApiError("Pick a skin");
  const user = await loadUser(id);
  const owned =
    prize.price === 0 || (await AppDataSource.manager.exists(UnlockEntity, { where: { user: { id }, prizeId: prize.id } }));
  if (!owned) throw ApiError(400, `${user.username} hasn't unlocked ${skinName(prize.skin)} yet`);
  if (user.skin !== prize.skin) {
    await AppDataSource.manager.update(UserEntity, id, { skin: prize.skin });
    await logAction(admin!, "user", id, `Switched ${user.username} to ${skinName(prize.skin)}`);
  }
  return res.status(200).json({ skin: prize.skin });
};

export const removeUnlock = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const prizeId = String(params.prizeId ?? "");
  const user = await loadUser(id);
  const result = await AppDataSource.manager.delete(UnlockEntity, { user: { id }, prizeId });
  if (!result.affected) throw Missing(`${user.username} doesn't have ${prizeId}`);
  const prize = SKIN_PRIZES.find((entry) => entry.id === prizeId);
  if (prize && user.skin === prize.skin) await AppDataSource.manager.update(UserEntity, id, { skin: "arcade" });
  await logAction(admin!, "user", id, `Took back ${prize ? skinName(prize.skin) : prizeId} from ${user.username}`);
  return res.status(200).json({ removed: prizeId });
};

export const adjustPoints = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 100000) throw ApiError("amount must be a non-zero whole number");
  const reason = text(body?.reason, "reason", { optional: true, max: 200 });
  const user = await loadUser(id);

  const balance = await doTransaction(async (m) => {
    const current = await ticketBalance(id, m);
    if (current + amount < 0) throw ApiError(`${user.username} only has ${current} points`);
    await m.save(TicketEntryEntity, { user: { id } as UserEntity, amount, reason: TicketReason.ADMIN });
    await logAction(admin!, "user", id, `${amount > 0 ? "Gave" : "Removed"} ${Math.abs(amount)} points ${amount > 0 ? "to" : "from"} ${user.username}${reason ? `: ${reason}` : ""}`, m);
    return current + amount;
  });
  return res.status(200).json({ balance });
};

export const moveUser = async ({ params, body, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const user = await loadUser(id);
  const joinCode = text(body?.joinCode, "joinCode", { optional: true, max: 16 })?.toUpperCase();

  const target = await doTransaction(async (m) => {
    const household = joinCode
      ? await m.findOne(HouseholdEntity, { where: { joinCode } })
      : await createHousehold(user.username, m);
    if (!household) throw UserError(404, "household.codeNotFound");
    if (household.id === user.household.id) throw UserError(400, "household.alreadyMember");
    await m.update(UserEntity, id, { household: { id: household.id } as HouseholdEntity });
    await logAction(admin!, "user", id, `Moved ${user.username} from ${user.household.name ?? `household ${user.household.id}`} to ${household.name ?? `household ${household.id}`}`, m);
    await logAction(admin!, "household", household.id, `Moved ${user.username} in`, m);
    await logAction(admin!, "household", user.household.id, `Moved ${user.username} out`, m);
    return household;
  });
  return res.status(200).json({ householdId: target.id });
};

export const logOutUser = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  const user = await loadUser(id);
  await revokeAllRefreshTokenByUserId(id, "user-logout");
  await logAction(admin!, "user", id, `Logged ${user.username} out everywhere`);
  return res.status(200).json({ ok: true });
};

export const deleteUser = async ({ params, user: admin }: Request, res: Response) => {
  const id = idOf(params.id);
  if (id === admin!.id) throw ApiError(400, "You can't delete yourself from here");
  const user = await loadUser(id);
  if (user.type === "admin") throw ApiError(400, "Remove their admin role first");
  await removeUser({ id });
  await logAction(admin!, "user", id, `Deleted ${user.username} (${user.email})`);
  return res.status(200).json({ ok: true });
};
