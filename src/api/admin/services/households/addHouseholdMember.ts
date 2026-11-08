import updateUserColumns from "@/api/users/services/updateUserColumns";
import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { householdLabel, text } from "../../helpers";
import logAction from "../actions/logAction";
import loadHousehold from "./loadHousehold";

const addHouseholdMember = (admin: UserEntity, id: number, rawEmail: unknown, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const household = await loadHousehold(id, m);
    const email = text(rawEmail, "email")!.toLowerCase();
    const user = await m
      .createQueryBuilder(UserEntity, "user")
      .leftJoinAndSelect("user.household", "household")
      .where("LOWER(user.email) = :email", { email })
      .getOne();
    if (!user) throw ApiError(404, `No account uses ${email}`);
    if (user.household?.id === id) throw UserError(400, "household.alreadyMember");

    await updateUserColumns(user.id, { household: { id } as HouseholdEntity }, m);
    await logAction(admin, "household", id, `Added ${user.username}`, m);
    await logAction(admin, "user", user.id, `Moved ${user.username} to ${householdLabel(household)}`, m);
    if (user.household) await logAction(admin, "household", user.household.id, `Moved ${user.username} out`, m);
    return { userId: user.id };
  });

export default addHouseholdMember;
