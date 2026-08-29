import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import validateCrudPayload from "@/services/validateCrudPayload";
import findUser from "./findUser";

const UPDATABLE_FIELDS = ["username", "email", "description", "type"] as const;

const updateUser = async (user: Partial<UserEntity>): Promise<UserEntity> => {
  if (!user.id) {
    throw ApiError("User id needed to update");
  }
  const foundUser = await findUser(user).catch(() => {
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

  await UserRepository.update(userId, editables);

  return updatedUser;
};

export default updateUser;
