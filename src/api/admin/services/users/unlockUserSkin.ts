import updateUserColumns from "@/api/users/services/updateUserColumns";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { SKIN_PRIZES, skinName } from "../../helpers";
import logAction from "../actions/logAction";
import loadUser from "./loadUser";

const unlockUserSkin = (admin: UserEntity, id: number, prizeId: unknown, wear: boolean, manager?: EntityManager) => {
  const prize = SKIN_PRIZES.find((entry) => entry.id === prizeId && entry.price > 0);
  if (!prize) throw ApiError("Pick a premium skin");
  return inTransaction(manager, async (m) => {
    const user = await loadUser(id, m);
    const owned = await m.exists(UnlockEntity, { where: { user: { id }, prizeId: prize.id } });
    if (owned) throw ApiError(409, `${user.username} already has ${skinName(prize.skin)}`);
    await m.save(UnlockEntity, { user: { id } as UserEntity, prizeId: prize.id, source: "gift" });
    if (wear) await updateUserColumns(id, { skin: prize.skin }, m);
    await logAction(admin, "user", id, `Unlocked ${skinName(prize.skin)} for ${user.username}${wear ? " and switched them to it" : ""}`, m);
    return { prizeId: prize.id };
  });
};

export default unlockUserSkin;
