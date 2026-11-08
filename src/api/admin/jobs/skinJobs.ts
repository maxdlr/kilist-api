import { DEFAULT_SKIN } from "@/entities/UserEntity";
import switchEveryoneToDefaultSkin from "../services/jobs/switchEveryoneToDefaultSkin";
import { AdminJob } from "./types";

export const switchToDefaultSkin: AdminJob = {
  id: "switch-to-default-skin",
  title: "Switch everyone to the default skin",
  description: `Sets the skin of every user who isn't wearing "${DEFAULT_SKIN}" to "${DEFAULT_SKIN}".`,
  run: (m, dryRun) => switchEveryoneToDefaultSkin(dryRun, m),
};
