import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import TicketEntryRepository from "@/repositories/TicketEntryRepository";
import findManager from "@/utils/findManager";
import { EntityManager, LessThan } from "typeorm";

const hasSwipedBefore = (userId: number, before: Date | null, manager?: EntityManager) =>
  findManager(TicketEntryRepository, manager).exists(TicketEntryEntity, {
    where: {
      user: { id: userId },
      reason: TicketReason.SWIPE,
      ...(before && { createdAt: LessThan(before) }),
    },
  });

export default hasSwipedBefore;
