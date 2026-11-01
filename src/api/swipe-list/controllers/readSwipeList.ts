import { Request, Response } from "express";
import findSwipeList from "../services/findSwipeList";

const readSwipeList = async ({ params, user }: Request, res: Response) => {
  const { id } = params;

  if (!id) {
    throw Missing("Missing required parameter: id");
  }

  const swipeList = await findSwipeList({
    where: { id: Number(id), household: { id: user!.household.id } },
    loadRelationIds: false,
    relations: ["startFoods"],
  });

  return res.status(200).send(swipeList);
};

export default readSwipeList;
