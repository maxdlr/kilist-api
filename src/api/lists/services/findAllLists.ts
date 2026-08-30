import GroceryListEntity from "@/entities/GroceryListEntity";
import GroceryListRepository from "@/repositories/GroceryListRepository";
import { FindOptionsWhere } from "typeorm";

const findAllLists = async (where?: FindOptionsWhere<GroceryListEntity>) => {
  const lists = await GroceryListRepository.find({
    where,
    relations: ["items"],
  });
  return lists;
};

export default findAllLists;
