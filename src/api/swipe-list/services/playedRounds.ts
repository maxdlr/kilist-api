import SwipeListEntity, { SwipeListStatus } from "@/entities/SwipeListEntity";
import { FindOptionsWhere, IsNull, Not } from "typeorm";

const playedRounds = (userId: number, householdId: number): FindOptionsWhere<SwipeListEntity>[] => {
  const completed = { status: SwipeListStatus.COMPLETED, endedAt: Not(IsNull()) };
  return [
    { ...completed, user: { id: userId } },
    { ...completed, user: IsNull(), household: { id: householdId } },
  ];
};

export default playedRounds;
