import createUser from "@/api/users/services/createUser";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { text } from "../../helpers";
import logAction from "../actions/logAction";

const addAdminUser = (admin: UserEntity, body: Record<string, unknown> | undefined, manager?: EntityManager) => {
  const username = text(body?.username, "username", { max: 64 })!;
  const email = text(body?.email, "email")!.toLowerCase();
  const password = text(body?.password, "password", { max: 128 })!;
  const joinCode = text(body?.joinCode, "joinCode", { optional: true, max: 16 });
  const householdName = joinCode ? undefined : text(body?.householdName, "householdName", { optional: true, max: 64 });

  return inTransaction(manager, async (m) => {
    const created = await createUser(
      joinCode
        ? { username, email, password, householdChoice: "join", joinCode: joinCode.toUpperCase() }
        : { username, email, password, householdChoice: "create", householdName },
      m,
    );
    await logAction(admin, "user", created.id, `Created ${username} (${email})`, m);
    return { id: created.id };
  });
};

export default addAdminUser;
