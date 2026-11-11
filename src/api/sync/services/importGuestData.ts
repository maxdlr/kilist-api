import { PRIZES } from "@/api/prizes/catalog";
import { findEvent } from "@/api/notifications/catalog";
import updateFoodInStockScore from "@/api/foods/services/updateFoodInStockScore";
import limitFoodHistories from "@/api/foodHistories/services/limitFoodHistories";
import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import skinAccess from "@/api/prizes/services/skinAccess";
import updateUserColumns from "@/api/users/services/updateUserColumns";
import { cleanProfiles } from "@/api/food-bank/profiles";
import { isBarcode, MAX_BARCODES, productChanges, QUANTITY_LENGTH } from "@/api/foods/helpers";
import { MAX_DECLINED, suggestionKey } from "@/api/households/helpers";
import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FrequencyEntity from "@/entities/FrequencyEntity";
import ListEntity from "@/entities/ListEntity";
import ShopListEntity, { ShopListStatus } from "@/entities/ShopListEntity";
import SwipeListEntity, { SwipeListStatus } from "@/entities/SwipeListEntity";
import SyncOpEntity from "@/entities/SyncOpEntity";
import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity, { SKIN_PATTERN } from "@/entities/UserEntity";
import { parseTzOffset, toLocalDay } from "@/helpers/localDay";
import { isLang } from "@/i18n";
import { EntityManager, IsNull, Not } from "typeorm";
import { clockSkew, resolveOpTime } from "../helpers";

const MAX_ITEMS = 50000;
const MAX_FREQUENCY_PER_FOOD = 100;
const NAME_LENGTH = 255;
const DESCRIPTION_LENGTH = 2000;
const CHUNK = 200;
const IMPORT_TYPE = "guest.import";

type GuestFood = {
  id: number;
  name: string;
  description?: string;
  icon?: string | null;
  imageUrl?: string | null;
  barcodes?: string[];
  quantity?: string | null;
  inStockScore: number;
  snoozedUntil?: string | null;
  lastBoughtAt?: string | null;
  onList: boolean;
  histories?: { isInStock: boolean | null; at: string }[];
};

type GuestRun = {
  startFoodIds: number[];
  boughtFoodIds: number[];
  buyLog?: { foodId: number; at: string }[];
  startedAt?: string | null;
  createdAt?: string | null;
  endedAt: string;
};

export type GuestData = {
  importId: string;
  sentAt?: string;
  tzOffset?: number;
  foods?: GuestFood[];
  frequencies?: { foodId: number; nextFoodId: number; count: number }[];
  playedAt?: string[];
  runs?: GuestRun[];
  balance?: number;
  ownedPrizes?: string[];
  recentSwipes?: { foodId: number | null; at: string }[];
  skin?: string;
  language?: string | null;
  notifications?: Record<string, unknown> | null;
  eaterProfiles?: string[];
  declinedSuggestions?: Record<string, { at: string; count: number }>;
};

const normalize = (name: string) => name.trim().toLowerCase();

const scanned = (guest: GuestFood) => (Array.isArray(guest.barcodes) ? guest.barcodes.filter(isBarcode) : []);

const listOf = <T>(value: T[] | undefined, label: string): T[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw ApiError(`${label} must be an array`);
  if (value.length > MAX_ITEMS) throw ApiError(`Too many ${label}`);
  return value;
};

const scaleFrequencies = (rows: { foodId: number; nextFoodId: number; count: number }[]) => {
  const totals = new Map<number, number>();
  for (const row of rows) totals.set(row.foodId, (totals.get(row.foodId) ?? 0) + row.count);
  return rows.map((row) => {
    const total = totals.get(row.foodId)!;
    return total <= MAX_FREQUENCY_PER_FOOD
      ? row
      : { ...row, count: Math.ceil((row.count * MAX_FREQUENCY_PER_FOOD) / total) };
  });
};

const importGuestData = async (
  user: UserEntity,
  data: GuestData,
  m: EntityManager,
  { withPreferences = false }: { withPreferences?: boolean } = {},
): Promise<boolean> => {
  if (typeof data?.importId !== "string" || !data.importId || data.importId.length > 64) {
    throw ApiError("A valid importId is required");
  }

  const done = await m.findOne(SyncOpEntity, {
    where: { user: { id: user.id }, opId: data.importId },
  });
  if (done) return false;

  const nowMs = Date.now();
  const skewMs = clockSkew(data.sentAt, nowMs);
  const when = (value: unknown) => resolveOpTime(value, skewMs, nowMs);
  const householdId = user.household.id;
  const household = { id: householdId };
  const userRef = { id: user.id };

  const list = await m.findOneOrFail(ListEntity, {
    where: { household, isMain: true },
    relations: { foods: true },
  });
  const existing = await m.find(FoodEntity, { where: { household } });
  const byName = new Map(existing.map((food) => [normalize(food.name), food]));
  const idMap = new Map<number, number>();

  for (const guest of listOf(data.foods, "foods")) {
    const name = String(guest?.name ?? "").trim().slice(0, NAME_LENGTH);
    if (!name || !Number.isInteger(guest.id)) continue;
    const histories = listOf(guest.histories, "histories");
    const bought = guest.lastBoughtAt ? when(guest.lastBoughtAt) : null;
    const snoozed = guest.snoozedUntil ? new Date(guest.snoozedUntil) : null;
    const twin = byName.get(normalize(name));

    if (twin) {
      idMap.set(guest.id, twin.id);
      if (guest.onList && !list.foods.some((food) => food.id === twin.id)) {
        list.foods.push(twin);
      }
      const update: Partial<FoodEntity> = {};
      if (bought && (!twin.lastBoughtAt || bought > twin.lastBoughtAt)) update.lastBoughtAt = bought;
      if (snoozed && (!twin.snoozedUntil || snoozed > new Date(twin.snoozedUntil))) {
        update.snoozedUntil = snoozed;
      }
      for (const barcode of scanned(guest)) Object.assign(twin, productChanges(twin, { barcode }));
      Object.assign(update, productChanges(twin, { quantity: guest.quantity }), { barcodes: twin.barcodes ?? null });
      if (Object.keys(update).length > 0) await m.update(FoodEntity, twin.id, update);
      for (const history of histories) {
        await createFoodHistory(
          { foodId: twin.id, isInStock: history.isInStock ?? null, userId: user.id, at: when(history.at) },
          m,
        );
      }
      if (histories.length > 0) {
        await limitFoodHistories(twin.id, m);
        await updateFoodInStockScore(twin.id, m);
      }
      continue;
    }

    const created = await m.save(FoodEntity, {
      name,
      description: String(guest.description ?? "").slice(0, DESCRIPTION_LENGTH),
      icon: guest.icon ?? null,
      barcodes: scanned(guest).slice(-MAX_BARCODES),
      quantity: typeof guest.quantity === "string" ? guest.quantity.slice(0, QUANTITY_LENGTH) : null,
      inStockScore: Number.isFinite(guest.inStockScore) ? guest.inStockScore : 1,
      household,
      lastBoughtAt: bought,
      ...(snoozed && { snoozedUntil: snoozed }),
    } as Partial<FoodEntity>);
    idMap.set(guest.id, created.id);
    byName.set(normalize(name), created as FoodEntity);
    if (guest.onList) list.foods.push(created as FoodEntity);
    if (histories.length > 0) {
      await m.save(
        FoodHistoryEntity,
        histories.map((history) => ({
          food: { id: created.id },
          isInStock: history.isInStock ?? null,
          user: userRef,
          createdAt: when(history.at),
        })) as Partial<FoodHistoryEntity>[],
        { chunk: CHUNK },
      );
    }
  }

  await m.save(ListEntity, list);

  const mapped = (id: unknown) => idMap.get(Number(id));

  const frequencyRows = scaleFrequencies(
    listOf(data.frequencies, "frequencies")
      .map((row) => ({
        foodId: mapped(row.foodId)!,
        nextFoodId: mapped(row.nextFoodId)!,
        count: Math.max(0, Math.floor(Number(row.count) || 0)),
      }))
      .filter((row) => row.foodId && row.nextFoodId && row.foodId !== row.nextFoodId && row.count > 0),
  );
  const frequencies = frequencyRows.flatMap((row) =>
    Array.from({ length: row.count }, () => ({
      food: { id: row.foodId },
      nextBoughtFood: { id: row.nextFoodId },
      household,
    })),
  );
  if (frequencies.length > 0) {
    await m.save(FrequencyEntity, frequencies as unknown as FrequencyEntity[], { chunk: CHUNK });
  }

  const tzOffset = parseTzOffset(data.tzOffset);
  const sessions = await m.find(SwipeListEntity, {
    where: { household, status: SwipeListStatus.COMPLETED, endedAt: Not(IsNull()) },
    select: { id: true, endedAt: true },
  });
  const playedDays = new Set(sessions.map((session) => toLocalDay(session.endedAt as Date, tzOffset)));
  const newSessions: Partial<SwipeListEntity>[] = [];
  for (const played of listOf(data.playedAt, "playedAt")) {
    const at = when(played);
    const day = toLocalDay(at, tzOffset);
    if (playedDays.has(day)) continue;
    playedDays.add(day);
    newSessions.push({ status: SwipeListStatus.COMPLETED, endedAt: at, household } as Partial<SwipeListEntity>);
  }
  if (newSessions.length > 0) await m.save(SwipeListEntity, newSessions, { chunk: CHUNK });

  for (const run of listOf(data.runs, "runs")) {
    const toRefs = (ids: number[]) =>
      listOf(ids, "run foods")
        .map(mapped)
        .filter((id): id is number => id !== undefined)
        .map((id) => ({ id }));
    await m.save(ShopListEntity, {
      household,
      user: userRef,
      status: ShopListStatus.COMPLETED,
      startFoods: toRefs(run.startFoodIds),
      boughtFoods: toRefs(run.boughtFoodIds),
      buyLog: listOf(run.buyLog, "buy log")
        .map((entry) => ({ foodId: mapped(entry.foodId)!, at: when(entry.at).toISOString() }))
        .filter((entry) => entry.foodId),
      startedAt: run.startedAt ? when(run.startedAt) : null,
      endedAt: when(run.endedAt),
      ...(run.createdAt && { createdAt: when(run.createdAt) }),
    } as unknown as ShopListEntity);
  }

  const balance = Math.floor(Number(data.balance) || 0);
  if (balance > 0) {
    await m.save(TicketEntryEntity, {
      user: userRef,
      amount: balance,
      reason: TicketReason.IMPORT,
    } as TicketEntryEntity);
  }
  const recentSwipes = listOf(data.recentSwipes, "recent swipes")
    .map((entry) => ({ foodId: mapped(entry.foodId), at: when(entry.at) }))
    .filter((entry) => entry.foodId !== undefined)
    .map((entry) => ({
      user: userRef,
      amount: 0,
      reason: TicketReason.SWIPE,
      foodId: entry.foodId,
      createdAt: entry.at,
    }));
  if (recentSwipes.length > 0) {
    await m.save(TicketEntryEntity, recentSwipes as unknown as TicketEntryEntity[], { chunk: CHUNK });
  }

  const owned = await m.find(UnlockEntity, { where: { user: userRef } });
  const prizes = new Set(listOf(data.ownedPrizes, "prizes"));
  for (const prize of PRIZES) {
    if (!prizes.has(prize.id) || prize.price === 0 || prize.accountOnly) continue;
    if (owned.some((unlock) => unlock.prizeId === prize.id)) continue;
    await m.save(UnlockEntity, { user: userRef, prizeId: prize.id, source: "points" } as UnlockEntity);
  }

  if (withPreferences) {
    const columns: { skin?: string; language?: string | null; notifications?: Record<string, string> } = {};
    if (
      typeof data.skin === "string" &&
      SKIN_PATTERN.test(data.skin) &&
      (await skinAccess(user.id, data.skin, m, false)) === "allowed"
    ) {
      columns.skin = data.skin;
    }
    if (data.language === null || isLang(data.language)) columns.language = data.language ?? null;
    const notifications = Object.fromEntries(
      Object.entries(data.notifications && typeof data.notifications === "object" ? data.notifications : {}).filter(
        ([id, choice]) => choice === "none" || (choice === "push" && findEvent(id)?.channels.includes("push")),
      ),
    ) as Record<string, string>;
    if (Object.keys(notifications).length > 0) columns.notifications = notifications;
    if (Object.keys(columns).length > 0) await updateUserColumns(user.id, columns, m);
  }

  const current = await m.findOne(HouseholdEntity, { where: { id: householdId } });
  if (current) {
    const profiles = cleanProfiles(data.eaterProfiles);
    const declined = { ...(current.declinedSuggestions ?? {}) };
    const incoming =
      data.declinedSuggestions && typeof data.declinedSuggestions === "object" ? data.declinedSuggestions : {};
    for (const [name, entry] of Object.entries(incoming).slice(0, MAX_DECLINED)) {
      const count = Math.max(1, Math.floor(Number(entry?.count) || 1));
      const key = suggestionKey(name);
      if (!key || Number.isNaN(Date.parse(String(entry?.at))) || declined[key]) continue;
      declined[key] = { at: when(entry.at).toISOString(), count };
    }
    await m.update(HouseholdEntity, householdId, {
      ...(!current.eaterProfiles?.length && profiles.length > 0 && { eaterProfiles: profiles }),
      declinedSuggestions: Object.fromEntries(
        Object.entries(declined)
          .sort(([, a], [, b]) => Date.parse(b.at) - Date.parse(a.at))
          .slice(0, MAX_DECLINED),
      ),
    });
  }

  await m.save(SyncOpEntity, {
    user: userRef,
    opId: data.importId,
    type: IMPORT_TYPE,
    status: "applied",
    ids: null,
  } as SyncOpEntity);

  return true;
};

export default importGuestData;
