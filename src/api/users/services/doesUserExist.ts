import UserRepository from "@/repositories/UserRepository";

const doesUserExist = async (id: number): Promise<boolean> => {
  const userExists = await UserRepository.exists({
    where: { id: id },
  });
  return userExists;
};

export default doesUserExist;
