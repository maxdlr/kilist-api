import findAllFoods from "@/api/foods/services/findAllFoods";
import SessionEntity from "@/entities/SessionEntity";
import SessionRepository from "@/repositories/SessionRepository";
import findManager from "@/utils/findManager";
import { EntityManager, IsNull, LessThan, Or } from "typeorm";

const createSession = async (manager?: EntityManager) => {
  const m = findManager(SessionRepository, manager);

  const foods = await findAllFoods(
    {
      where: {
        inStockScore: LessThan(1),
        snoozedUntil: Or(IsNull(), LessThan(new Date())),
      },
    },
    m,
  );

  const session = new SessionEntity();

  session.startFoods = foods;

  const createdSession = await m.save(SessionEntity, session);

  return createdSession;
};
export default createSession;
