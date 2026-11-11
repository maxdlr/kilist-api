import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const removeHouseholdIfEmpty = async (householdId: number, manager?: EntityManager): Promise<boolean> => {
  const m = findManager(HouseholdRepository, manager);

  const members = await m.countBy(UserEntity, { household: { id: householdId } });
  if (members > 0) return false;

  await m.softDelete(FoodEntity, { household: { id: householdId } });
  await m.softDelete(HouseholdEntity, householdId);

  return true;
};

export default removeHouseholdIfEmpty;
