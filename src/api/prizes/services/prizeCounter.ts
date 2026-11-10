import { EntityManager } from "typeorm";
import { buildCounter } from "../helpers";
import findOwnedPrizeIds from "./findOwnedPrizeIds";
import reservedTickets from "./reservedTickets";
import ticketBalance from "./ticketBalance";

const prizeCounter = async (userId: number, manager?: EntityManager, isAdmin = false) => {
  const balance = await ticketBalance(userId, manager);
  const owned = await findOwnedPrizeIds(userId, manager);
  const reserved = await reservedTickets(userId, manager);
  return buildCounter(balance, owned, isAdmin, reserved);
};

export default prizeCounter;
