import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import validateCrudPayload from "@/services/validateCrudPayload";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import findUser from "./findUser";

const UPDATABLE_FIELDS = ["username", "email", "description"] as const;

const updateUser = async (
  user: Partial<UserEntity>,
  manager?: EntityManager,
): Promise<UserEntity> => {
  const m = findManager(UserRepository, manager);
  if (!user.id) {
    throw ApiError("User id needed to update");
  }
  const foundUser = await findUser(user, false, m).catch(() => {
    throw ApiError("User doesn't exist");
  });

  const userId = foundUser.id;

  // Pick only known updatable column fields
  const editables: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    if (field in user && user[field] !== undefined) {
      editables[field] = user[field];
    }
  }

  if (!Object.keys(editables).length) {
    return foundUser;
  }

  const updatedUser: UserEntity = UserRepository.merge(
    foundUser as UserEntity,
    editables as Partial<UserEntity>,
  );

  await validateCrudPayload(updatedUser);

  await m.update(UserEntity, userId, editables);

  return updatedUser;
};

export default updateUser;
