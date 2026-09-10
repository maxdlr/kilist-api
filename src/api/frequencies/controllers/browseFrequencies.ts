import { Request, Response } from "express";
import findAllFrequencies from "../services/findAllFrequencies";

const browseFrequencies = async ({ query }: Request, res: Response) => {
  const allFrequencies = await findAllFrequencies(query);
  res.status(200).json(allFrequencies);
};

export default browseFrequencies;
