import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { listLabel } from "../../helpers";
import logAction from "../actions/logAction";
import loadList from "./loadList";

const deleteAdminList = (admin: UserEntity, id: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const list = await loadList(id, m);
    if (list.isMain) throw ApiError(400, "Make another list the main one first");
    await m.delete(ListEntity, id);
    await logAction(admin, "list", id, `Deleted ${listLabel(list)}`, m);
    return { ok: true };
  });

export default deleteAdminList;
