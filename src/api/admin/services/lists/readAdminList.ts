import FoodEntity from "@/entities/FoodEntity";
import ListRepository from "@/repositories/ListRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import recentActions from "../actions/recentActions";
import loadList from "./loadList";

const readAdminList = async (id: number, manager?: EntityManager) => {
  const m = findManager(ListRepository, manager);
  const list = await loadList(id, m);
  const onList = new Set(list.foods.map((food) => food.id));
  const householdFoods = await m.find(FoodEntity, {
    where: { household: { id: list.household.id } },
    select: { id: true, name: true },
    order: { name: "ASC" },
  });
  return {
    id,
    title: list.title,
    isMain: list.isMain,
    household: { id: list.household.id, name: list.household.name ?? null },
    foods: list.foods.map((food) => ({ id: food.id, name: food.name })).sort((a, b) => a.name.localeCompare(b.name)),
    available: householdFoods.filter((food) => !onList.has(food.id)).map((food) => ({ id: food.id, name: food.name })),
    actions: await recentActions("list", id, m),
  };
};

export default readAdminList;
