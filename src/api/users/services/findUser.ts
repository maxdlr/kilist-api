import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";

const findUser = async (
  {
    id,
    username,
    email,
  }: Partial<Pick<UserEntity, "id" | "username" | "email">>,
  withPassword: boolean = false,
): Promise<UserEntity> => {
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

    user = await UserRepository.createQueryBuilder("user")
      .addSelect("user._password")
      .where(alias, value)
      .getOne();
  } else {
    user = await UserRepository.findOne({
      where: id
        ? { id: Number(id) }
        : username
          ? { username }
          : email
            ? { email }
            : {},
      loadRelationIds: {
        relations: ["lists"],
      },
    });
  }

  if (!user) {
    throw Missing("Cannot find user");
  }

  return user;
};

export default findUser;
