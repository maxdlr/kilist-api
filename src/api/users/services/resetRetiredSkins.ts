import { PRIZES } from "@/api/prizes/catalog";
import UserEntity, { DEFAULT_SKIN } from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In, Not } from "typeorm";

const resetRetiredSkins = async (manager?: EntityManager) => {
  const m = findManager(UserRepository, manager);
  const skins = PRIZES.filter((prize) => prize.kind === "skin").map((prize) => prize.skin);
  const result = await m.update(UserEntity, { skin: Not(In(skins)) }, { skin: DEFAULT_SKIN });
  return result.affected ?? 0;
};

export default resetRetiredSkins;
