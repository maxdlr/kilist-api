import ListEntity from "@/entities/ListEntity";
import ListRepository from "@/repositories/ListRepository";
import { FindOptionsWhere } from "typeorm";

const findList = async (where: FindOptionsWhere<ListEntity>) => {
  const list = await ListRepository.findOne({
    where,
    relations: ["items"],
    order: {
      items: {
        inStockScore: "DESC",
      },
    },
  });

  if (!list) {
    throw Missing("List not found");
  }

  return list;
};

export default findList;
