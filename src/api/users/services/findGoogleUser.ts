import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const findGoogleUser = async (
  { googleId, email }: { googleId: string; email: string },
  manager?: EntityManager,
) => {
  const m = findManager(UserRepository, manager);
  const relations = { household: true };

  return (
    (await m.findOne(UserEntity, { where: { googleId }, relations })) ??
    (await m.findOne(UserEntity, { where: { email }, relations }))
  );
};

export default findGoogleUser;
