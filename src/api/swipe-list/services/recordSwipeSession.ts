import SwipeListEntity, { SwipeListStatus } from "@/entities/SwipeListEntity";
import SwipeListRepository from "@/repositories/SwipeListRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const recordSwipeSession = async (
  householdId: number,
  manager?: EntityManager,
  at: Date = new Date(),
): Promise<SwipeListEntity> => {
  const m = findManager(SwipeListRepository, manager);

  const session = new SwipeListEntity();
  session.status = SwipeListStatus.COMPLETED;
  session.endedAt = at;
  session.household = { id: householdId } as SwipeListEntity["household"];

  return await m.save(SwipeListEntity, session);
};

export default recordSwipeSession;
