import { Request, Response } from "express";
import findSwipeList from "../services/findSwipeList";
import updateSwipeList from "../services/updateSwipeList";
import doTransaction from "@/utils/doTransaction";

const endSwipeList = async ({ params }: Request, res: Response) => {
  if (!params.id) {
    throw ApiError("SwipeList id is required");
  }

  return await doTransaction(async (m) => {
    const swipeList = await findSwipeList(
      {
        where: {
          id: Number(params.id),
        },
      },
      m,
    );

    if (!swipeList) {
      return res.status(200).end();
    }

    await updateSwipeList(
      {
        id: Number(params.id),
        endedAt: new Date(),
      },
      m,
    );
    return res.status(200).end();
  });
};

export default endSwipeList;
