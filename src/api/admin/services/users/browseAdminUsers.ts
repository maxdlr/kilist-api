import UserEntity from "@/entities/UserEntity";
import { isLang } from "@/i18n";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { Brackets, EntityManager } from "typeorm";
import { pageOf } from "../../helpers";
import lastActiveByUser from "./lastActiveByUser";

const browseAdminUsers = async (query: Record<string, unknown>, manager?: EntityManager) => {
  const m = findManager(UserRepository, manager);
  const { offset, limit } = pageOf(query);
  const qb = m
    .createQueryBuilder(UserEntity, "user")
    .leftJoinAndSelect("user.household", "household")
    .orderBy("user.id", "DESC");

  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    qb.andWhere(
      new Brackets((where) =>
        where.where("user.username LIKE :search", { search: `%${search}%` }).orWhere("user.email LIKE :search"),
      ),
    );
  }
  if (query.admin === "1") qb.andWhere("user.type = 'admin'");
  if (typeof query.skin === "string" && query.skin) qb.andWhere("user.skin = :skin", { skin: query.skin });
  if (query.language === "auto") qb.andWhere("user.language IS NULL");
  else if (isLang(query.language)) qb.andWhere("user.language = :language", { language: query.language });
  if (query.householdId) qb.andWhere("household.id = :householdId", { householdId: Number(query.householdId) });

  const [users, total] = await qb.skip(offset).take(limit).getManyAndCount();
  const lastActive = await lastActiveByUser(users.map((user) => user.id), m);

  return {
    total,
    items: users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      type: user.type,
      skin: user.skin,
      language: user.language,
      deviceLanguage: user.deviceLanguage,
      household: user.household ? { id: user.household.id, name: user.household.name ?? null } : null,
      lastActive: lastActive.get(user.id) ?? null,
    })),
  };
};

export default browseAdminUsers;
