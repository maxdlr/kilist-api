import { Request, Response } from "express";
import houseVotes from "../services/houseVotes";

const readVotes = async ({ user }: Request, res: Response) =>
  res.status(200).json(await houseVotes(user!));

export default readVotes;
