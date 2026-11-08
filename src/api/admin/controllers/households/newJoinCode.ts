import { Request, Response } from "express";
import { idOf } from "../../helpers";
import newHouseholdJoinCode from "../../services/households/newHouseholdJoinCode";

const newJoinCode = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await newHouseholdJoinCode(admin!, idOf(params.id)));

export default newJoinCode;
