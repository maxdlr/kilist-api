import ListEntity from "@/entities/ListEntity";
import ListRepository from "@/repositories/ListRepository";
import { FindOptionsWhere } from "typeorm";

const findList = async (where: FindOptionsWhere<ListEntity>) => {
  console.log("findList where:", where);

  const list = await ListRepository.findOne({
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
