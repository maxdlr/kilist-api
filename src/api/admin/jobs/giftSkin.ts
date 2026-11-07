import { PRIZES } from "@/api/prizes/catalog";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import { AdminJob } from "./types";

const GIFTABLE = PRIZES.filter((prize) => prize.kind === "skin" && prize.price > 0);

const skinName = (skin: string) => skin.charAt(0).toUpperCase() + skin.slice(1);

export const giftSkin: AdminJob = {
  id: "gift-skin",
  title: "Give a skin to a user",
  description: "Unlocks a premium skin for one signed-up user, for free. It doesn't change their tickets.",
  fields: [
    {
      name: "prizeId",
      label: "Skin",
      kind: "choice",
      options: GIFTABLE.map((prize) => ({ value: prize.id, label: skinName(prize.skin) })),
    },
    { name: "email", label: "User's email", kind: "email" },
  ],
  run: async (m, dryRun, input) => {
    const prize = GIFTABLE.find((entry) => entry.id === input.prizeId);
    const email = (input.email ?? "").trim().toLowerCase();

    if (!prize) return { affected: 0, summary: "Pick a skin to give." };
    if (!email) return { affected: 0, summary: "Enter the user's email." };

    const user = await m
      .createQueryBuilder(UserEntity, "user")
      .where("LOWER(user.email) = :email", { email })
      .getOne();
    const name = skinName(prize.skin);

    if (!user) return { affected: 0, summary: `No account uses ${email}.` };

    const owned = await m.findOne(UnlockEntity, {
      where: { user: { id: user.id }, prizeId: prize.id },
    });
    if (owned) return { affected: 0, summary: `${user.username} (${email}) already has ${name}.` };

    if (!dryRun) {
      await m.save(UnlockEntity, { user: { id: user.id } as UserEntity, prizeId: prize.id });
    }

    return {
      affected: 1,
      summary: `${user.username} (${email}) ${dryRun ? "would get" : "now has"} ${name}.`,
    };
  },
};
