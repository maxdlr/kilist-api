import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { EntityManager, In, MoreThanOrEqual } from "typeorm";
import {
  findPrize,
  PAID_SWIPES_PER_DAY,
  PREMIUM_FOR_EVERYONE,
  prizeForSkin,
  PRIZES,
  SPEED_BONUS_TICKETS,
  SPEED_WINDOW_MS,
  SWIPE_TICKETS,
} from "../catalog";

const PAY_WINDOW_MS = 24 * 3600000;

const inTransaction = <T>(
  manager: EntityManager | undefined,
  work: (m: EntityManager) => Promise<T>,
) =>
  manager?.queryRunner?.isTransactionActive
    ? work(manager)
    : AppDataSource.manager.transaction(work);

const lockUser = (m: EntityManager, userId: number) =>
  m
    .createQueryBuilder(UserEntity, "user")
    .setLock("pessimistic_write")
    .where("user.id = :userId", { userId })
    .getOne();

const userRef = (userId: number) => ({ id: userId }) as UserEntity;

export const ticketBalance = async (userId: number, manager?: EntityManager) => {
  const m = manager ?? AppDataSource.manager;
  const row = await m
    .createQueryBuilder(TicketEntryEntity, "entry")
    .select("COALESCE(SUM(entry.amount), 0)", "balance")
    .where("entry.userId = :userId", { userId })
    .getRawOne<{ balance: string | number }>();
  return Number(row?.balance ?? 0);
};

export const awardSwipe = (
  userId: number,
  foodId: number,
  manager?: EntityManager,
) =>
  inTransaction(manager, async (m) => {
    await lockUser(m, userId);

    const now = new Date();
    const recentSwipes = await m.find(TicketEntryEntity, {
      where: {
        user: { id: userId },
        reason: TicketReason.SWIPE,
        createdAt: MoreThanOrEqual(new Date(now.getTime() - PAY_WINDOW_MS)),
      },
      order: { createdAt: "DESC", id: "DESC" },
    });

    const balance = await ticketBalance(userId, m);
    const alreadyPaid = recentSwipes.some((entry) => entry.foodId === foodId);
    if (alreadyPaid || recentSwipes.length >= PAID_SWIPES_PER_DAY) {
      return { earned: 0, bonus: 0, balance };
    }

    const previous = recentSwipes[0]?.createdAt;
    const isFast =
      previous !== undefined &&
      now.getTime() - previous.getTime() < SPEED_WINDOW_MS;
    const bonus = isFast ? SPEED_BONUS_TICKETS : 0;

    await m.save(TicketEntryEntity, [
      {
        user: userRef(userId),
        amount: SWIPE_TICKETS,
        reason: TicketReason.SWIPE,
        foodId,
        createdAt: now,
      },
      ...(isFast
        ? [
            {
              user: userRef(userId),
              amount: SPEED_BONUS_TICKETS,
              reason: TicketReason.SPEED,
              foodId,
              createdAt: now,
            },
          ]
        : []),
    ]);

    return {
      earned: SWIPE_TICKETS + bonus,
      bonus,
      balance: balance + SWIPE_TICKETS + bonus,
    };
  });

const ownedPrizeIds = async (userId: number, manager?: EntityManager) => {
  const m = manager ?? AppDataSource.manager;
  const unlocks = await m.find(UnlockEntity, {
    where: { user: { id: userId }, prizeId: In(PRIZES.map((prize) => prize.id)) },
  });
  return new Set(unlocks.map((unlock) => unlock.prizeId));
};

const buildCounter = (balance: number, owned: Set<string>, isAdmin = false) => ({
  balance,
  premium: PREMIUM_FOR_EVERYONE,
  prizes: PRIZES.map((prize) => {
    const isOwned = prize.price === 0 || owned.has(prize.id);
    return { ...prize, owned: isOwned, wearable: isOwned || isAdmin || PREMIUM_FOR_EVERYONE };
  }),
});

export const prizeCounter = async (userId: number, manager?: EntityManager, isAdmin = false) => {
  const [balance, owned] = await Promise.all([
    ticketBalance(userId, manager),
    ownedPrizeIds(userId, manager),
  ]);
  return buildCounter(balance, owned, isAdmin);
};

export type SkinAccess = "unknown" | "locked" | "allowed";

export const skinAccess = async (
  userId: number,
  skin: string,
  manager?: EntityManager,
  isAdmin = false,
): Promise<SkinAccess> => {
  const prize = prizeForSkin(skin);
  if (!prize) return "unknown";
  if (prize.price === 0 || isAdmin || PREMIUM_FOR_EVERYONE) return "allowed";
  return (await ownedPrizeIds(userId, manager)).has(prize.id)
    ? "allowed"
    : "locked";
};

export const redeemPrize = (
  userId: number,
  prizeId: string,
  manager?: EntityManager,
) =>
  inTransaction(manager, async (m) => {
    const prize = findPrize(prizeId);
    if (!prize) throw Missing(`Prize ${prizeId} not found`);

    await lockUser(m, userId);

    const owned = await ownedPrizeIds(userId, m);
    if (prize.price === 0 || owned.has(prize.id)) {
      throw UserError(409, "prizes.alreadyOwned");
    }

    const balance = await ticketBalance(userId, m);
    if (balance < prize.price) {
      throw UserError(402, "prizes.notEnough");
    }

    await m.save(UnlockEntity, { user: userRef(userId), prizeId: prize.id });
    await m.save(TicketEntryEntity, {
      user: userRef(userId),
      amount: -prize.price,
      reason: TicketReason.REDEEM,
      prizeId: prize.id,
    });

    return buildCounter(balance - prize.price, new Set(owned).add(prize.id));
  });
