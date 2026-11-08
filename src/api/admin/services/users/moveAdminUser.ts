import createHousehold from "@/api/households/services/createHousehold";
import updateUserColumns from "@/api/users/services/updateUserColumns";
import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { text } from "../../helpers";
import logAction from "../actions/logAction";
import loadUser from "./loadUser";

const moveAdminUser = (admin: UserEntity, id: number, rawJoinCode: unknown, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const user = await loadUser(id, m);
    const joinCode = text(rawJoinCode, "joinCode", { optional: true, max: 16 })?.toUpperCase();

    const household = joinCode
      ? await m.findOne(HouseholdEntity, { where: { joinCode } })
      : await createHousehold(user.username, m);
    if (!household) throw UserError(404, "household.codeNotFound");
    if (household.id === user.household.id) throw UserError(400, "household.alreadyMember");
    await updateUserColumns(id, { household: { id: household.id } as HouseholdEntity }, m);
    await logAction(admin, "user", id, `Moved ${user.username} from ${user.household.name ?? `household ${user.household.id}`} to ${household.name ?? `household ${household.id}`}`, m);
    await logAction(admin, "household", household.id, `Moved ${user.username} in`, m);
    await logAction(admin, "household", user.household.id, `Moved ${user.username} out`, m);
    return { householdId: household.id };
  });

export default moveAdminUser;
