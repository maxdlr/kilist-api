import clearAuthCookies from "@/api/auth/services/clearAuthCookies";
import notifyHousehold from "@/api/notifications/services/notifyHousehold";
import notifyUser from "@/api/notifications/services/notifyUser";
import findHouseholdMembers from "@/api/households/services/findHouseholdMembers";
import findUser from "../services/findUser";
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
    throw UserError(400, "account.adminUndeletable");
  }

  const target = await findUser({ id: targetId });
  const householdId = target.household.id;
  const lastInHousehold = (await findHouseholdMembers(householdId)).length <= 1;

  await removeUser({ id: targetId });

  await notifyUser(target, "accountDeleted", {
    name: target.username,
    email: target.email,
    lastInHousehold,
  });
  if (!lastInHousehold) {
    await notifyHousehold("memberLeft", householdId, target).catch(() => 0);
  }

  if (isSelf) {
    await clearAuthCookies(res);
  }

  return res.status(200).send("User deleted");
};

export default deleteUser;
