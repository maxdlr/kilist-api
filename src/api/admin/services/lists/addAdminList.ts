import createList from "@/api/lists/services/createList";
import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { idOf, text } from "../../helpers";
import logAction from "../actions/logAction";

const addAdminList = (admin: UserEntity, body: Record<string, unknown> | undefined, manager?: EntityManager) => {
  const householdId = idOf(body?.householdId, "householdId");
  const title = text(body?.title, "title", { max: 120 })!;
  return inTransaction(manager, async (m) => {
    if (!(await m.exists(HouseholdEntity, { where: { id: householdId } }))) throw Missing(`Household ${householdId} not found`);
    const list = await createList(householdId, { title, isMain: false }, m);
    await logAction(admin, "list", list.id, `Created ${title}`, m);
    return { id: list.id };
  });
};

export default addAdminList;
