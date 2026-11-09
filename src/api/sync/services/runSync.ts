import UserEntity from "@/entities/UserEntity";
import doTransaction from "@/utils/doTransaction";
import { createHash } from "crypto";
import { SyncOpInput } from "../helpers";
import buildSnapshot from "./buildSnapshot";
import processOps from "./processOps";

const runSync = async (
  user: UserEntity,
  {
    ops,
    sentAt,
    knownHash,
  }: { ops: SyncOpInput[]; sentAt: unknown; knownHash?: unknown },
) => {
  const { acks, ids, retry } = await processOps(user, ops, sentAt);
  const serverTime = new Date().toISOString();

  if (retry) {
    return { acks, ids, retry, serverTime };
  }

  const snapshot = await doTransaction((m) => buildSnapshot(user, m));
  const hash = createHash("sha1").update(JSON.stringify(snapshot)).digest("hex");

  return {
    acks,
    ids,
    retry,
    serverTime,
    hash,
    ...(hash !== knownHash && { snapshot }),
  };
};

export default runSync;
