import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import TicketEntryRepository from "@/repositories/TicketEntryRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In } from "typeorm";
import { findPrize } from "../catalog";

const reservedTickets = async (userId: number, manager?: EntityManager) => {
  const entries = await findManager(TicketEntryRepository, manager).find(TicketEntryEntity, {
    where: { user: { id: userId }, reason: In([TicketReason.IMPORT, TicketReason.REDEEM]) },
    order: { id: "ASC" },
    select: { id: true, amount: true, reason: true, prizeId: true },
  });
  let reserved = 0;
  for (const entry of entries) {
    if (entry.reason === TicketReason.IMPORT) reserved += Math.max(0, entry.amount);
    else if (!findPrize(entry.prizeId ?? "")?.accountOnly) reserved = Math.max(0, reserved + entry.amount);
  }
  return reserved;
};

export default reservedTickets;
