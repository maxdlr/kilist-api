import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager, Like } from "typeorm";

const MAX_LENGTH = 24;

const findFreeUsername = async (name: string, manager?: EntityManager) => {
  const m = findManager(UserRepository, manager);
  const cleaned = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, MAX_LENGTH);
  const base = cleaned.length >= 3 ? cleaned : `${cleaned}user`;

  const taken = new Set(
    (await m.find(UserEntity, { where: { username: Like(`${base}%`) }, select: { id: true, username: true } })).map(
      (user) => user.username,
    ),
  );
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
};

export default findFreeUsername;
