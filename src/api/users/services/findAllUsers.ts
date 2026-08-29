import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";

interface UserFilters {
  search?: string;
  maxResults?: number | string;
}

const findAllUsers = async (where?: UserFilters): Promise<UserEntity[]> => {
  const {
    search: _search,
    maxResults: _maxResults,
    ...sanitizedWhere
  } = where || {};
  const users = await UserRepository.find({
    where: sanitizedWhere,
    loadRelationIds: { relations: ["lists"] },
  });
  return users;
};

export default findAllUsers;
