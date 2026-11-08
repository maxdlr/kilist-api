import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import generateJoinCode from "@/utils/generateJoinCode";
import { EntityManager } from "typeorm";
import { householdLabel } from "../../helpers";
import logAction from "../actions/logAction";
import loadHousehold from "./loadHousehold";

const newHouseholdJoinCode = (admin: UserEntity, id: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const household = await loadHousehold(id, m);
    let joinCode = generateJoinCode();
    while (await m.exists(HouseholdEntity, { where: { joinCode } })) joinCode = generateJoinCode();
    await m.update(HouseholdEntity, id, { joinCode });
    await logAction(admin, "household", id, `New join code for ${householdLabel(household)} (was ${household.joinCode})`, m);
    return { joinCode };
  });

export default newHouseholdJoinCode;
