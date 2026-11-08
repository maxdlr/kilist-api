import findFoodIcon from "@/api/food-bank/findFoodIcon";
import createFood from "@/api/foods/services/createFood";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { idOf, text } from "../../helpers";
import logAction from "../actions/logAction";

const addAdminFood = (admin: UserEntity, body: Record<string, unknown> | undefined, manager?: EntityManager) => {
  const householdId = idOf(body?.householdId, "householdId");
  const name = text(body?.name, "name", { max: 120 })!;
  const description = text(body?.description, "description", { optional: true, max: 2000 });
  return inTransaction(manager, async (m) => {
    const household = await m.findOne(HouseholdEntity, { where: { id: householdId } });
    if (!household) throw Missing(`Household ${householdId} not found`);
    const main = await m.findOne(ListEntity, { where: { household: { id: householdId }, isMain: true } });
    if (!main) throw ApiError(400, "This household has no main list");
    const food = await createFood(householdId, main.id, { name, description, icon: findFoodIcon(name) }, m);
    await logAction(admin, "food", food.id, `Added ${name} to ${household.name || `household ${householdId}`}`, m);
    return { id: food.id };
  });
};

export default addAdminFood;
