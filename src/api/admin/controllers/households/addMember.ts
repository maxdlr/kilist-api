import { Request, Response } from "express";
import { idOf } from "../../helpers";
import addHouseholdMember from "../../services/households/addHouseholdMember";

const addMember = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await addHouseholdMember(admin!, idOf(params.id), body?.email));

export default addMember;
