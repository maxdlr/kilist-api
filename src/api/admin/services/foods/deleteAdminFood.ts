import FoodEntity from "@/entities/FoodEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { foodLabel } from "../../helpers";
import logAction from "../actions/logAction";
import loadFood from "./loadFood";

const deleteAdminFood = (admin: UserEntity, id: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const food = await loadFood(id, m);
    await m.delete(FoodEntity, id);
    await logAction(admin, "food", id, `Deleted ${foodLabel(food)}`, m);
    return { ok: true };
  });

export default deleteAdminFood;
