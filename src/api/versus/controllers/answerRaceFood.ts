import { Request, Response } from "express";
import answerRace from "../services/answerRace";

const idParam = (value: unknown, name: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) throw ApiError(`A valid ${name} is required`);
  return id;
};

const answerRaceFood = async ({ body, params, user }: Request, res: Response) =>
  res.status(200).json(
    await answerRace(user!, idParam(params.id, "race id"), {
      foodId: body?.foodId,
      answer: body?.answer,
      ms: body?.ms,
    }),
  );

export default answerRaceFood;
