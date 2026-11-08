import updateUserColumns from "@/api/users/services/updateUserColumns";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { SKIN_PRIZES, skinName } from "../../helpers";
import logAction from "../actions/logAction";
import loadUser from "./loadUser";

const setUserSkin = (admin: UserEntity, id: number, skin: unknown, manager?: EntityManager) => {
  const prize = SKIN_PRIZES.find((entry) => entry.skin === skin);
  if (!prize) throw ApiError("Pick a skin");
  return inTransaction(manager, async (m) => {
    const user = await loadUser(id, m);
    const owned = prize.price === 0 || (await m.exists(UnlockEntity, { where: { user: { id }, prizeId: prize.id } }));
    if (!owned) throw ApiError(400, `${user.username} hasn't unlocked ${skinName(prize.skin)} yet`);
    if (user.skin !== prize.skin) {
      await updateUserColumns(id, { skin: prize.skin }, m);
      await logAction(admin, "user", id, `Switched ${user.username} to ${skinName(prize.skin)}`, m);
    }
    return { skin: prize.skin };
  });
};

export default setUserSkin;
