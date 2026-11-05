import UserEntity, { DEFAULT_SKIN } from "@/entities/UserEntity";
import { In, Not } from "typeorm";
import { AdminJob } from "./types";

const people = (count: number) => `${count} ${count === 1 ? "user" : "users"}`;

export const switchToDefaultSkin: AdminJob = {
  id: "switch-to-default-skin",
  title: "Switch everyone to the default skin",
  description: `Sets the skin of every user who isn't wearing "${DEFAULT_SKIN}" to "${DEFAULT_SKIN}".`,
  run: async (m, dryRun) => {
    const users = await m.find(UserEntity, {
      select: { id: true },
      where: { skin: Not(DEFAULT_SKIN) },
    });

    if (!dryRun && users.length) {
      await m.update(
        UserEntity,
        { id: In(users.map((user) => user.id)) },
        { skin: DEFAULT_SKIN },
      );
    }

    return {
      affected: users.length,
      summary: `${people(users.length)} ${dryRun ? "would be" : "were"} switched to ${DEFAULT_SKIN}.`,
    };
  },
};
