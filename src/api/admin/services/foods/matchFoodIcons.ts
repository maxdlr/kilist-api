import findFoodIcon from "@/api/food-bank/findFoodIcon";
import FoodEntity from "@/entities/FoodEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager, IsNull } from "typeorm";

const matchFoodIcons = (adminId: number, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const foods = await m.find(FoodEntity, { where: { icon: IsNull() }, select: { id: true, name: true } });
    let matched = 0;
    for (const food of foods) {
      const icon = findFoodIcon(food.name);
      if (!icon) continue;
      await m.update(FoodEntity, food.id, { icon });
      matched += 1;
    }
    return { checked: foods.length, matched, adminId };
  });

export default matchFoodIcons;
