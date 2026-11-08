import { Request, Response } from "express";
import addAdminUser from "../../services/users/addAdminUser";

const addUser = async ({ body, user: admin }: Request, res: Response) =>
  res.status(201).json(await addAdminUser(admin!, body));

export default addUser;
