import UserEntity, { DEFAULT_SKIN } from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In, Not } from "typeorm";

const people = (count: number) => `${count} ${count === 1 ? "user" : "users"}`;

const switchEveryoneToDefaultSkin = async (dryRun: boolean, manager?: EntityManager) => {
  const m = findManager(UserRepository, manager);
  const users = await m.find(UserEntity, {
    select: { id: true },
    where: { skin: Not(DEFAULT_SKIN) },
  });

  if (!dryRun && users.length) {
    await m.update(
      UserEntity,
      { id: In(users.map((user) => user.id)) },
      { skin: DEFAULT_SKIN },
    );
  }

  return {
    affected: users.length,
    summary: `${people(users.length)} ${dryRun ? "would be" : "were"} switched to ${DEFAULT_SKIN}.`,
  };
};

export default switchEveryoneToDefaultSkin;
