import resetFoodHistories from "@/api/foodHistories/services/resetFoodHistories";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { foodLabel } from "../../helpers";
import logAction from "../actions/logAction";
import loadFood from "./loadFood";

const resetAdminFoodScore = (admin: UserEntity, id: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const food = await loadFood(id, m);
    await resetFoodHistories(id, m);
    await logAction(admin, "food", id, `Reset the score of ${foodLabel(food)}`, m);
    return { ok: true };
  });

export default resetAdminFoodScore;
