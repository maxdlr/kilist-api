import UserRepository from "@/repositories/UserRepository";
import findUser from "./findUser";

const removeUser = async (where: any) => {
  const user = await findUser(where);
  if (!user) {
    throw ApiError("User doesn't exist.");
  }

  return await UserRepository.delete(where);
};

export default removeUser;
