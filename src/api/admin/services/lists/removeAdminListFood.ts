import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { listLabel } from "../../helpers";
import logAction from "../actions/logAction";
import loadList from "./loadList";

const removeAdminListFood = (admin: UserEntity, id: number, foodId: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const list = await loadList(id, m);
    const food = list.foods.find((entry) => entry.id === foodId);
    if (!food) throw Missing(`Food ${foodId} is not on this list`);
    await m.createQueryBuilder().relation(ListEntity, "foods").of(id).remove(foodId);
    await logAction(admin, "list", id, `Removed ${food.name} from ${listLabel(list)}`, m);
    return { ok: true };
  });

export default removeAdminListFood;
