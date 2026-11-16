import SwipeListEntity, { SwipeListStatus } from "@/entities/SwipeListEntity";
import { FindOptionsWhere, IsNull, Not } from "typeorm";

/**
 * The completed daily rounds that count for one player: their own, plus the household's rounds from
 * before games were per member (no user), so nobody lost their history when that changed.
 */
const playedRounds = (userId: number, householdId: number): FindOptionsWhere<SwipeListEntity>[] => {
  const completed = { status: SwipeListStatus.COMPLETED, endedAt: Not(IsNull()) };
  return [
    { ...completed, user: { id: userId } },
    { ...completed, user: IsNull(), household: { id: householdId } },
  ];
};

export default playedRounds;
