import UnlockEntity from "@/entities/UnlockEntity";
import UnlockRepository from "@/repositories/UnlockRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In } from "typeorm";
import { PRIZES } from "../catalog";

const findOwnedPrizeIds = async (userId: number, manager?: EntityManager) => {
  const unlocks = await findManager(UnlockRepository, manager).find(UnlockEntity, {
    where: { user: { id: userId }, prizeId: In(PRIZES.map((prize) => prize.id)) },
  });
  return new Set(unlocks.map((unlock) => unlock.prizeId));
};

export default findOwnedPrizeIds;
