import ListEntity from "@/entities/ListEntity";
import ListRepository from "@/repositories/ListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";

const findList = async (
  where: FindOptionsWhere<ListEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(ListRepository, manager);

  const list = await m.findOne(ListEntity, {
    where,
    relations: ["foods"],
    order: {
      foods: {
        inStockScore: "ASC",
      },
    },
  });

  if (!list) {
    throw Missing("List not found");
  }

  return list;
};

export default findList;
