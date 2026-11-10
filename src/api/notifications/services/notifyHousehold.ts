import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager, Not } from "typeorm";
import notifyUser from "./notifyUser";

const notifyHousehold = async (
  event: "memberJoined" | "memberLeft",
  householdId: number,
  member: Pick<UserEntity, "id" | "username">,
  manager?: EntityManager,
) => {
  const m = findManager(UserRepository, manager);
  const household = await m.findOne(HouseholdEntity, { where: { id: householdId } });
  if (!household) return 0;
  const others = await m.find(UserEntity, {
    where: { household: { id: householdId }, id: Not(member.id) },
  });
  const players = await m.countBy(UserEntity, { household: { id: householdId } });
  for (const other of others) {
    await notifyUser(other, event, {
      name: other.username,
      email: other.email,
      member: member.username,
      household: household.name || "Kilist",
      players,
    });
  }
  return others.length;
};

export default notifyHousehold;
