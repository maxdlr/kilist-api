import { Request, Response } from "express";
import processStockUpdate from "../services/processStockUpdate";

const stockUpdate = async ({ body }: Request, res: Response) => {
  await processStockUpdate(body);
  return res.status(200).end();
};

export default stockUpdate;
