import FoodEntity from "@/entities/FoodEntity";
import ListEntity from "@/entities/ListEntity";
import RaceEntity from "@/entities/RaceEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import UserEntity from "@/entities/UserEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { EntityManager, LessThan } from "typeorm";
import { NEEDED_BELOW } from "../../helpers";
import recentActions from "../actions/recentActions";
import lastActiveByHousehold from "./lastActiveByHousehold";
import loadHousehold from "./loadHousehold";

const readAdminHousehold = async (id: number, manager?: EntityManager) => {
  const m = findManager(HouseholdRepository, manager);
  const household = await loadHousehold(id, m);
  const [members, lists, foods, needed, trips, lastTrip, races, lastRace, lastActive] = await Promise.all([
    m.find(UserEntity, { where: { household: { id } }, order: { id: "ASC" } }),
    m.find(ListEntity, { where: { household: { id } }, relations: { foods: true }, order: { id: "ASC" } }),
    m.count(FoodEntity, { where: { household: { id } } }),
    m.count(FoodEntity, { where: { household: { id }, inStockScore: LessThan(NEEDED_BELOW) } }),
    m.count(ShopListEntity, { where: { household: { id } } }),
    m.findOne(ShopListEntity, { where: { household: { id } }, order: { createdAt: "DESC" } }),
    m.count(RaceEntity, { where: { household: { id } } }),
    m.findOne(RaceEntity, { where: { household: { id } }, order: { createdAt: "DESC" } }),
    lastActiveByHousehold([id], m),
  ]);

  return {
    id,
    name: household.name ?? null,
    joinCode: household.joinCode,
    createdAt: household.createdAt,
    lastActive: lastActive.get(id) ?? null,
    members: members.map((member) => ({ id: member.id, username: member.username, email: member.email, type: member.type })),
    lists: lists.map((list) => ({ id: list.id, title: list.title, isMain: list.isMain, foods: list.foods.length })),
    foods,
    needed,
    trips: { count: trips, last: lastTrip?.createdAt ?? null },
    races: { count: races, last: lastRace?.createdAt ?? null },
    actions: await recentActions("household", id, m),
  };
};

export default readAdminHousehold;
