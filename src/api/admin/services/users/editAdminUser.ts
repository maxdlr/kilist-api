import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { isLang } from "@/i18n";
import { EntityManager } from "typeorm";
import { text } from "../../helpers";
import logAction from "../actions/logAction";
import loadUser from "./loadUser";

const editAdminUser = (admin: UserEntity, id: number, body: Record<string, any> | undefined, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const user = await loadUser(id, m);
    const changes: Partial<UserEntity> = {};
    const notes: string[] = [];

    const username = text(body?.username, "username", { optional: true, max: 64 });
    if (username && username !== user.username) {
      if (await m.exists(UserEntity, { where: { username } })) throw UserError(400, "auth.userExists");
      changes.username = username;
      notes.push(`name ${user.username} → ${username}`);
    }
    const email = text(body?.email, "email", { optional: true })?.toLowerCase();
    if (email && email !== user.email) {
      if (await m.exists(UserEntity, { where: { email } })) throw UserError(400, "auth.userExists");
      changes.email = email;
      notes.push(`email → ${email}`);
    }
    if (body && "language" in body) {
      const language = body.language ?? null;
      if (language !== null && !isLang(language)) throw ApiError("language must be a supported code or null");
      if (language !== user.language) {
        changes.language = language;
        notes.push(`language → ${language ?? "phone"}`);
      }
    }

    if (notes.length) {
      await m.update(UserEntity, id, changes);
      await logAction(admin, "user", id, `Edited ${user.username}: ${notes.join(", ")}`, m);
    }
    return { changed: notes.length };
  });

export default editAdminUser;
