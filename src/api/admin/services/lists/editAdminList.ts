import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager, Not } from "typeorm";
import { listLabel, text } from "../../helpers";
import logAction from "../actions/logAction";
import loadList from "./loadList";

const editAdminList = (admin: UserEntity, id: number, body: Record<string, unknown> | undefined, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const list = await loadList(id, m);
    const title = text(body?.title, "title", { optional: true, max: 120 });
    if (title && title !== list.title) {
      await m.update(ListEntity, id, { title });
      await logAction(admin, "list", id, `Renamed ${listLabel(list)} to ${title}`, m);
    }
    if (body?.isMain === true && !list.isMain) {
      await m.update(ListEntity, { household: { id: list.household.id }, id: Not(id) }, { isMain: false });
      await m.update(ListEntity, id, { isMain: true });
      await logAction(admin, "list", id, `Made ${listLabel(list)} the main list`, m);
    }
    return { ok: true };
  });

export default editAdminList;
