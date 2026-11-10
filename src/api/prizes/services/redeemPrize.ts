import inTransaction from "@/helpers/inTransaction";
import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import UnlockEntity from "@/entities/UnlockEntity";
import { EntityManager } from "typeorm";
import { findPrize } from "../catalog";
import { buildCounter, userRef } from "../helpers";
import findOwnedPrizeIds from "./findOwnedPrizeIds";
import lockUser from "./lockUser";
import reservedTickets from "./reservedTickets";
import ticketBalance from "./ticketBalance";

const redeemPrize = (userId: number, prizeId: string, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const prize = findPrize(prizeId);
    if (!prize) throw Missing(`Prize ${prizeId} not found`);

    await lockUser(userId, m);

    const owned = await findOwnedPrizeIds(userId, m);
    if (prize.price === 0 || owned.has(prize.id)) {
      throw UserError(409, "prizes.alreadyOwned");
    }

    const balance = await ticketBalance(userId, m);
    const reserved = await reservedTickets(userId, m);
    const funds = prize.accountOnly ? balance - reserved : balance;
    if (funds < prize.price) {
      throw UserError(402, "prizes.notEnough");
    }

    await m.save(UnlockEntity, { user: userRef(userId), prizeId: prize.id, source: "points" });
    await m.save(TicketEntryEntity, {
      user: userRef(userId),
      amount: -prize.price,
      reason: TicketReason.REDEEM,
      prizeId: prize.id,
    });

    return buildCounter(
      balance - prize.price,
      new Set(owned).add(prize.id),
      false,
      prize.accountOnly ? reserved : Math.max(0, reserved - prize.price),
    );
  });

export default redeemPrize;
