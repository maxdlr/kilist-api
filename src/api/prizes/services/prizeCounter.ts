import { EntityManager } from "typeorm";
import { buildCounter } from "../helpers";
import findOwnedPrizeIds from "./findOwnedPrizeIds";
import ticketBalance from "./ticketBalance";

const prizeCounter = async (userId: number, manager?: EntityManager, isAdmin = false) => {
  const balance = await ticketBalance(userId, manager);
  const owned = await findOwnedPrizeIds(userId, manager);
  return buildCounter(balance, owned, isAdmin);
};

export default prizeCounter;
