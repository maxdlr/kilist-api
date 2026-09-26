import ListEntity from "@/entities/ListEntity";
import ListRepository from "@/repositories/ListRepository";
import { FindOptionsWhere } from "typeorm";

const findAllLists = async (where?: FindOptionsWhere<ListEntity>) => {
  const lists = await ListRepository.find({
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
