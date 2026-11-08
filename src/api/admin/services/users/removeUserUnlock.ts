import updateUserColumns from "@/api/users/services/updateUserColumns";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { SKIN_PRIZES, skinName } from "../../helpers";
import logAction from "../actions/logAction";
import loadUser from "./loadUser";

const removeUserUnlock = (admin: UserEntity, id: number, prizeId: string, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const user = await loadUser(id, m);
    const result = await m.delete(UnlockEntity, { user: { id }, prizeId });
    if (!result.affected) throw Missing(`${user.username} doesn't have ${prizeId}`);
    const prize = SKIN_PRIZES.find((entry) => entry.id === prizeId);
    if (prize && user.skin === prize.skin) await updateUserColumns(id, { skin: "arcade" }, m);
    await logAction(admin, "user", id, `Took back ${prize ? skinName(prize.skin) : prizeId} from ${user.username}`, m);
    return { removed: prizeId };
  });

export default removeUserUnlock;
