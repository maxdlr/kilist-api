import createHousehold from "@/api/households/services/createHousehold";
import removeHouseholdIfEmpty from "@/api/households/services/removeHouseholdIfEmpty";
import updateUserColumns from "@/api/users/services/updateUserColumns";
import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { householdLabel } from "../../helpers";
import logAction from "../actions/logAction";
import loadHousehold from "./loadHousehold";

const removeHouseholdMember = (admin: UserEntity, id: number, userId: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const household = await loadHousehold(id, m);
    const user = await m.findOne(UserEntity, { where: { id: userId, household: { id } } });
    if (!user) throw Missing(`User ${userId} is not in this household`);

    const fresh = await createHousehold(user.username, m);
    await updateUserColumns(userId, { household: { id: fresh.id } as HouseholdEntity }, m);
    const emptied = await removeHouseholdIfEmpty(id, m);
    await logAction(admin, "household", id, `Removed ${user.username}${emptied ? ", deleted the empty household" : ""}`, m);
    await logAction(admin, "user", userId, `Removed from ${householdLabel(household)}, moved to a new household`, m);
    return { householdId: fresh.id };
  });

export default removeHouseholdMember;
