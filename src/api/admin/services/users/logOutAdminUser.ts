import revokeAllRefreshTokenByUserId from "@/api/auth/services/revokeAllRefreshTokenByUserId";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import logAction from "../actions/logAction";
import loadUser from "./loadUser";

const logOutAdminUser = (admin: UserEntity, id: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const user = await loadUser(id, m);
    await revokeAllRefreshTokenByUserId(id, "user-logout", m);
    await logAction(admin, "user", id, `Logged ${user.username} out everywhere`, m);
    return { ok: true };
  });

export default logOutAdminUser;
