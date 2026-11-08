import FoodEntity from "@/entities/FoodEntity";
import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager, In } from "typeorm";
import { listLabel } from "../../helpers";
import logAction from "../actions/logAction";
import loadList from "./loadList";

const addAdminListFoods = (admin: UserEntity, id: number, foodIds: unknown, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const list = await loadList(id, m);
    const ids: number[] = Array.isArray(foodIds) ? foodIds.map(Number).filter(Number.isInteger) : [];
    if (!ids.length) throw ApiError("foodIds must be a non-empty array");
    const foods = await m.find(FoodEntity, { where: { id: In(ids), household: { id: list.household.id } } });
    const fresh = foods.filter((food) => !list.foods.some((entry) => entry.id === food.id));
    if (fresh.length) {
      list.foods = [...list.foods, ...fresh];
      await m.save(ListEntity, list);
      await logAction(admin, "list", id, `Added ${fresh.map((food) => food.name).join(", ")} to ${listLabel(list)}`, m);
    }
    return { added: fresh.length };
  });

export default addAdminListFoods;
