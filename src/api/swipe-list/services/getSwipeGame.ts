import { toLocalDay } from "@/helpers/localDay";
import { EntityManager } from "typeorm";
import findAllSwipeLists from "./findAllSwipeLists";
import playedRounds from "./playedRounds";

export interface SwipeGame {
  level: number;
  playedToday: boolean;
}

/** The player's daily game: each household member has their own. */
const getSwipeGame = async (
  userId: number,
  householdId: number,
  tzOffset: number,
  manager?: EntityManager,
): Promise<SwipeGame> => {
  const sessions = await findAllSwipeLists(
    { loadRelationIds: false, where: playedRounds(userId, householdId) },
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
