import { SwipeListStatus } from "@/entities/SwipeListEntity";
import { EntityManager, IsNull, Not } from "typeorm";
import findAllSwipeLists from "./findAllSwipeLists";

export interface SwipeGame {
  level: number;
  playedToday: boolean;
}

const MAX_TZ_OFFSET_MINUTES = 840;

export const parseTzOffset = (value: unknown): number => {
  const offset = Number(value);
  return Number.isFinite(offset) && Math.abs(offset) <= MAX_TZ_OFFSET_MINUTES
    ? offset
    : 0;
};

const toLocalDay = (date: Date, tzOffset: number) =>
  new Date(date.getTime() - tzOffset * 60000).toISOString().slice(0, 10);

const getSwipeGame = async (
  householdId: number,
  tzOffset: number,
  manager?: EntityManager,
): Promise<SwipeGame> => {
  const sessions = await findAllSwipeLists(
    {
      loadRelationIds: false,
      where: {
        household: { id: householdId },
        status: SwipeListStatus.COMPLETED,
        endedAt: Not(IsNull()),
      },
    },
    manager,
  );

  const playedDays = new Set(
    sessions.map((session) => toLocalDay(session.endedAt as Date, tzOffset)),
  );
  const playedToday = playedDays.has(toLocalDay(new Date(), tzOffset));

  return {
    level: playedToday ? playedDays.size : playedDays.size + 1,
    playedToday,
  };
};

export default getSwipeGame;
