import FoodEntity from "@/entities/FoodEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { foodLabel } from "../../helpers";
import logAction from "../actions/logAction";
import loadFood from "./loadFood";

const unsnoozeAdminFood = (admin: UserEntity, id: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const food = await loadFood(id, m);
    await m.update(FoodEntity, id, { snoozedUntil: null as unknown as Date });
    await logAction(admin, "food", id, `Cleared "next time" on ${foodLabel(food)}`, m);
    return { ok: true };
  });

export default unsnoozeAdminFood;
