import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import buildDashboard from "../services/buildDashboard";

const getDashboard = async (req: Request, res: Response) => {
  const householdId = req.user!.household.id;

  const dashboard = await doTransaction((m) => buildDashboard(householdId, m));

  return res.status(200).send(dashboard);
};
export default getDashboard;
