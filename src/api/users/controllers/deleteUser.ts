import { Request, Response } from "express";
import removeUser from "../../users/services/removeUser";

const deleteUser = async (
  { query, user }: Request,
  res: Response,
): Promise<Response<string>> => {
  if (!user || user.type !== "admin") {
    throw Unauthorized();
  }

  const targetId = Number(query.id);
  if (!query.id || Number.isNaN(targetId)) {
    throw BadValidation([
      { property: "id", messages: ["id must be a valid number"] },
    ]);
  }

  if (user.id !== targetId && user.type !== "admin") {
    throw Unauthorized();
  }

  await removeUser({ id: targetId });

  return res.status(200).send("User deleted");
};

export default deleteUser;
