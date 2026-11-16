import { RULES } from "@/api/catalog/rules";
import inTransaction from "@/helpers/inTransaction";
import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import { Between, EntityManager } from "typeorm";
import { SPEED_WINDOW_MS, swipePay } from "../catalog";
import { userRef } from "../helpers";
import hasSwipedBefore from "./hasSwipedBefore";
import lockUser from "./lockUser";
import ticketBalance from "./ticketBalance";

const PAY_WINDOW_MS = RULES.tickets.payWindowHours * 3600000;

const awardSwipe = (
  userId: number,
  foodId: number,
  manager?: EntityManager,
  at: Date = new Date(),
) =>
  inTransaction(manager, async (m) => {
    await lockUser(userId, m);

    const recentSwipes = await m.find(TicketEntryEntity, {
      where: {
        user: { id: userId },
        reason: TicketReason.SWIPE,
        createdAt: Between(
          new Date(at.getTime() - PAY_WINDOW_MS),
          new Date(at.getTime() + PAY_WINDOW_MS),
        ),
      },
      order: { createdAt: "DESC", id: "DESC" },
    });

    const balance = await ticketBalance(userId, m);
    const swipedBefore = await hasSwipedBefore(
      userId,
      new Date(at.getTime() - PAY_WINDOW_MS),
      m,
    );
    const pay = swipePay(recentSwipes.length, !swipedBefore);
    const alreadyPaid = recentSwipes.some((entry) => entry.foodId === foodId);
    if (alreadyPaid || pay.perSwipe === 0) {
      return { earned: 0, bonus: 0, balance };
    }

    const previous = recentSwipes.find(
      (entry) => entry.createdAt && entry.createdAt <= at,
    )?.createdAt;
    const isFast =
      previous !== undefined &&
      at.getTime() - previous.getTime() < SPEED_WINDOW_MS;
    const bonus = isFast ? pay.speedBonus : 0;

    await m.save(TicketEntryEntity, [
      {
        user: userRef(userId),
        amount: pay.perSwipe,
        reason: TicketReason.SWIPE,
        foodId,
        createdAt: at,
      },
      ...(bonus > 0
        ? [
            {
              user: userRef(userId),
              amount: bonus,
              reason: TicketReason.SPEED,
              foodId,
              createdAt: at,
            },
          ]
        : []),
    ]);

    return {
      earned: pay.perSwipe + bonus,
      bonus,
      balance: balance + pay.perSwipe + bonus,
    };
  });

export default awardSwipe;
