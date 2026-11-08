import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
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

    const remainingMembers = await m.countBy(UserEntity, {
      household: { id: householdId },
    });
    if (remainingMembers === 0) {
      const lists = await m.find(ListEntity, {
        where: { household: { id: householdId } },
        select: { id: true },
      });
      if (lists.length > 0) {
        await m.delete(
          ListEntity,
          lists.map((list) => list.id),
        );
      }

      await m.delete(HouseholdEntity, householdId);
    }
  });
};

export default removeUser;
