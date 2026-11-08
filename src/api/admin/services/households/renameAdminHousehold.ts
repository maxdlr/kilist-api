import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { householdLabel, text } from "../../helpers";
import logAction from "../actions/logAction";
import loadHousehold from "./loadHousehold";

const renameAdminHousehold = (admin: UserEntity, id: number, rawName: unknown, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const household = await loadHousehold(id, m);
    const name = text(rawName, "name", { max: 64 })!;
    await m.update(HouseholdEntity, id, { name });
    await logAction(admin, "household", id, `Renamed ${householdLabel(household)} to ${name}`, m);
    return { name };
  });

export default renameAdminHousehold;
