import clearAuthCookies from "@/api/auth/services/clearAuthCookies";
import { Request, Response } from "express";
import removeUser from "../../users/services/removeUser";

const deleteUser = async (
  { query, user }: Request,
  res: Response,
): Promise<Response<string>> => {
  if (!user) {
    throw Unauthorized();
  }

  const targetId = Number(query.id);
  if (!query.id || Number.isNaN(targetId)) {
    throw BadValidation([
      { property: "id", messages: ["id must be a valid number"] },
    ]);
  }

  const isSelf = user.id === targetId;

  if (!isSelf && user.type !== "admin") {
    throw Forbidden();
  }

  if (isSelf && user.type === "admin") {
    throw ApiError(400, "The admin account cannot be deleted");
  }

  await removeUser({ id: targetId });

  if (isSelf) {
    await clearAuthCookies(res);
  }

  return res.status(200).send("User deleted");
};

export default deleteUser;
