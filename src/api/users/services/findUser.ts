import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const findUser = async (
  {
    id,
    username,
    email,
  }: Partial<Pick<UserEntity, "id" | "username" | "email">>,
  withPassword: boolean = false,
  manager?: EntityManager,
): Promise<UserEntity> => {
  const m = findManager(UserRepository, manager);
  let user!: UserEntity | null;

  if (withPassword) {
    const alias = id ? "user.id = :id" : "user.username = :username";
    const value = id
      ? { id }
      : username
        ? { username }
        : email
          ? { email }
          : {};

    user = await m
      .createQueryBuilder(UserEntity, "user")
      .addSelect("user._password")
      .where(alias, value)
      .getOne();
  } else {
    user = await m.findOne(UserEntity, {
      where: id
        ? { id: Number(id) }
        : username
          ? { username }
          : email
            ? { email }
            : {},
      relations: ["household"],
    });
  }

  if (!user) {
    throw Missing("Cannot find user");
  }

  return user;
};

export default findUser;
