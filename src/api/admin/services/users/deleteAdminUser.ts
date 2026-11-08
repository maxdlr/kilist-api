import removeUser from "@/api/users/services/removeUser";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import logAction from "../actions/logAction";
import loadUser from "./loadUser";

const deleteAdminUser = (admin: UserEntity, id: number, manager?: EntityManager) => {
  if (id === admin.id) throw ApiError(400, "You can't delete yourself from here");
  return inTransaction(manager, async (m) => {
    const user = await loadUser(id, m);
    if (user.type === "admin") throw ApiError(400, "Remove their admin role first");
    await removeUser({ id }, m);
    await logAction(admin, "user", id, `Deleted ${user.username} (${user.email})`, m);
    return { ok: true };
  });
};

export default deleteAdminUser;
