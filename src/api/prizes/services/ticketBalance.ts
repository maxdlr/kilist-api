import TicketEntryEntity from "@/entities/TicketEntryEntity";
import TicketEntryRepository from "@/repositories/TicketEntryRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const ticketBalance = async (userId: number, manager?: EntityManager) => {
  const row = await findManager(TicketEntryRepository, manager)
    .createQueryBuilder(TicketEntryEntity, "entry")
    .select("COALESCE(SUM(entry.amount), 0)", "balance")
    .where("entry.userId = :userId", { userId })
    .getRawOne<{ balance: string | number }>();
  return Number(row?.balance ?? 0);
};

export default ticketBalance;
