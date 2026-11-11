import deleteOrphans from "../services/jobs/deleteOrphans";
import { AdminJob } from "./types";

export const deleteOrphansJob: AdminJob = {
  id: "delete-orphans",
  title: "Delete orphaned households and foods",
  description:
    "Marks as deleted every household with no member, with its foods, and every food whose household is gone. The rows stay in the database for the stats.",
  run: (m, dryRun) => deleteOrphans(dryRun, m),
};
