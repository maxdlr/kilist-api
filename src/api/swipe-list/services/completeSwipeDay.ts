import { toLocalDay } from "@/helpers/localDay";
import { SwipeListStatus } from "@/entities/SwipeListEntity";
import { EntityManager, IsNull, Not } from "typeorm";
import findAllSwipeLists from "./findAllSwipeLists";
import recordSwipeSession from "./recordSwipeSession";

const completeSwipeDay = async (
  householdId: number,
  tzOffset: number,
  at: Date,
  m: EntityManager,
): Promise<void> => {
  const sessions = await findAllSwipeLists(
    {
      loadRelationIds: false,
      where: {
        household: { id: householdId },
        status: SwipeListStatus.COMPLETED,
        endedAt: Not(IsNull()),
      },
    },
    m,
  );
  const day = toLocalDay(at, tzOffset);
  if (sessions.some((session) => toLocalDay(session.endedAt as Date, tzOffset) === day)) {
    return;
  }

  await recordSwipeSession(householdId, m, at);
};

export default completeSwipeDay;
