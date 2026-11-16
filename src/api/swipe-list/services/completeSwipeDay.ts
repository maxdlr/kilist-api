import { toLocalDay } from "@/helpers/localDay";
import { EntityManager } from "typeorm";
import findAllSwipeLists from "./findAllSwipeLists";
import playedRounds from "./playedRounds";
import recordSwipeSession from "./recordSwipeSession";

const completeSwipeDay = async (
  householdId: number,
  userId: number,
  tzOffset: number,
  at: Date,
  m: EntityManager,
): Promise<void> => {
  const sessions = await findAllSwipeLists(
    { loadRelationIds: false, where: playedRounds(userId, householdId) },
    m,
  );
  const day = toLocalDay(at, tzOffset);
  if (sessions.some((session) => toLocalDay(session.endedAt as Date, tzOffset) === day)) {
    return;
  }

  await recordSwipeSession(householdId, userId, m, at);
};

export default completeSwipeDay;
