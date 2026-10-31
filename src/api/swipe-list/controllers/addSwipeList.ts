import { Request, Response } from "express";
import { IsNull, MoreThan, Or } from "typeorm";
import createSwipeList from "../services/createSwipeList";
import findSwipeList from "../services/findSwipeList";
import doTransaction from "@/utils/doTransaction";

const addSwipeList = async (_: Request, res: Response) => {
  const swipeList = await doTransaction(async (m) => {
    const existingOpenSwipeList = await findSwipeList(
      { where: { endedAt: Or(IsNull(), MoreThan(new Date())) } },
      m,
    );

    if (existingOpenSwipeList) {
      return res.status(200).json(existingOpenSwipeList);
    }

    const createdSwipeList = await createSwipeList(m);

    return await findSwipeList(
      {
        where: { id: createdSwipeList.id },
        loadRelationIds: false,
        relations: ["startFoods"],
      },
      m,
    );
  });

  return res.status(200).json(swipeList);
};

export default addSwipeList;
