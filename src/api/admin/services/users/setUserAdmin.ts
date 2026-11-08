import updateUserColumns from "@/api/users/services/updateUserColumns";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import logAction from "../actions/logAction";
import loadUser from "./loadUser";

const setUserAdmin = (admin: UserEntity, id: number, makeAdmin: boolean, manager?: EntityManager) => {
  if (id === admin.id && !makeAdmin) throw ApiError(400, "You can't remove your own admin role");
  const type = makeAdmin ? "admin" : "user";
  return inTransaction(manager, async (m) => {
    const user = await loadUser(id, m);
    await updateUserColumns(id, { type }, m);
    await logAction(admin, "user", id, `${makeAdmin ? "Made" : "Removed admin role from"} ${user.username}${makeAdmin ? " admin" : ""}`, m);
    return { type };
  });
};

export default setUserAdmin;
