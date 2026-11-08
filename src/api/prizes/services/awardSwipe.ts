import inTransaction from "@/helpers/inTransaction";
import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import { EntityManager, MoreThanOrEqual } from "typeorm";
import {
  PAID_SWIPES_PER_DAY,
  SPEED_BONUS_TICKETS,
  SPEED_WINDOW_MS,
  SWIPE_TICKETS,
} from "../catalog";
import { userRef } from "../helpers";
import lockUser from "./lockUser";
import ticketBalance from "./ticketBalance";

const PAY_WINDOW_MS = 24 * 3600000;

const awardSwipe = (userId: number, foodId: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    await lockUser(userId, m);

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

export default awardSwipe;
