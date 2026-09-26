import ListEntity from "@/entities/ListEntity";
import ListRepository from "@/repositories/ListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";

const findAllLists = async (
  where?: FindOptionsWhere<ListEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(ListRepository, manager);

  const lists = await m.find(ListEntity, {
    where,
    relations: ["foods"],
    order: {
      foods: {
        inStockScore: "ASC",
      },
    },
  });

  return lists;
};

export default findAllLists;
