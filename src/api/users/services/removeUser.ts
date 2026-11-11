import removeHouseholdIfEmpty from "@/api/households/services/removeHouseholdIfEmpty";
import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import findUser from "./findUser";

const removeUser = async (
  where: Partial<Pick<UserEntity, "id" | "username" | "email">>,
  manager?: EntityManager,
): Promise<void> => {
  const user = await findUser(where, false, manager);
  const householdId = user.household.id;

  await inTransaction(manager, async (m) => {
    await m.delete(RefreshTokenEntity, { userId: user.id });
    await m.delete(UserEntity, user.id);
    await removeHouseholdIfEmpty(householdId, m);
  });
};

export default removeUser;
