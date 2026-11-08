import { Request, Response } from "express";
import { idOf } from "../../helpers";
import removeHouseholdMember from "../../services/households/removeHouseholdMember";

const removeMember = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await removeHouseholdMember(admin!, idOf(params.id), idOf(params.userId, "user id")));

export default removeMember;
