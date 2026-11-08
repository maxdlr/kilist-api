import createHousehold from "@/api/households/services/createHousehold";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { householdLabel, text } from "../../helpers";
import logAction from "../actions/logAction";

const addAdminHousehold = (admin: UserEntity, rawName: unknown, manager?: EntityManager) => {
  const name = text(rawName, "name", { optional: true, max: 64 });
  return inTransaction(manager, async (m) => {
    const household = await createHousehold(name, m);
    await logAction(admin, "household", household.id, `Created ${householdLabel(household)}`, m);
    return { id: household.id };
  });
};

export default addAdminHousehold;
