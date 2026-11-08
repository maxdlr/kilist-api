import ListEntity from "@/entities/ListEntity";
import ListRepository from "@/repositories/ListRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const loadList = async (id: number, manager?: EntityManager) => {
  const list = await findManager(ListRepository, manager).findOne(ListEntity, { where: { id }, relations: { foods: true, household: true } });
  if (!list) throw Missing(`List ${id} not found`);
  return list;
};

export default loadList;
