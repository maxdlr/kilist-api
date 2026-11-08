import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { householdLabel } from "../../helpers";
import logAction from "../actions/logAction";
import loadHousehold from "./loadHousehold";

const deleteAdminHousehold = (admin: UserEntity, id: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const household = await loadHousehold(id, m);
    const members = await m.count(UserEntity, { where: { household: { id } } });
    if (members > 0) throw ApiError(400, "Remove every member first");

    const lists = await m.find(ListEntity, { where: { household: { id } }, select: { id: true } });
    if (lists.length) await m.delete(ListEntity, lists.map((list) => list.id));
    await m.delete(HouseholdEntity, id);
    await logAction(admin, "household", id, `Deleted ${householdLabel(household)}`, m);
    return { ok: true };
  });

export default deleteAdminHousehold;
