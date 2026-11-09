import SyncOpEntity from "@/entities/SyncOpEntity";
import UserEntity from "@/entities/UserEntity";
import SyncOpRepository from "@/repositories/SyncOpRepository";
import doTransaction from "@/utils/doTransaction";
import { LessThan } from "typeorm";
import {
  clockSkew,
  isRejection,
  MAX_OP_AGE_MS,
  MAX_OPS_PER_SYNC,
  OP_RETENTION_MS,
  resolveOpTime,
  SyncAck,
  SyncOpInput,
} from "../helpers";
import applyOp from "./applyOp";

const isValidOp = (op: SyncOpInput) =>
  typeof op?.id === "string" && op.id.length > 0 && op.id.length <= 64 && typeof op.type === "string";

const processOps = async (user: UserEntity, ops: SyncOpInput[], sentAt: unknown) => {
  const nowMs = Date.now();
  const skewMs = clockSkew(sentAt, nowMs);
  const ids: Record<string, number> = {};
  const acks: SyncAck[] = [];
  let retry = false;

  const record = (op: SyncOpInput, status: SyncAck["status"]) =>
    SyncOpRepository.save({
      user: { id: user.id },
      opId: op.id,
      type: op.type.slice(0, 32),
      status,
      ids: null,
    } as SyncOpEntity);

  for (const op of ops.slice(0, MAX_OPS_PER_SYNC)) {
    if (!isValidOp(op)) {
      if (typeof op?.id === "string") acks.push({ id: op.id, status: "rejected" });
      continue;
    }

    try {
      const status = await doTransaction(async (m) => {
        const done = await m.findOne(SyncOpEntity, {
          where: { user: { id: user.id }, opId: op.id },
        });
        if (done) {
          Object.assign(ids, done.ids ?? {});
          return done.status;
        }

        const at = resolveOpTime(op.at, skewMs, nowMs);
        if (nowMs - at.getTime() > MAX_OP_AGE_MS) {
          throw ApiError(`Operation ${op.id} is too old`);
        }

        const created = await applyOp(user, op, at, ids, m);
        Object.assign(ids, created ?? {});
        await m.save(SyncOpEntity, {
          user: { id: user.id },
          opId: op.id,
          type: op.type.slice(0, 32),
          status: "applied",
          ids: created,
        });
        return "applied" as const;
      });
      acks.push({ id: op.id, status });
    } catch (error) {
      if (!isRejection(error)) {
        console.error(`Sync operation ${op.id} failed`, error);
        retry = true;
        break;
      }
      await record(op, "rejected");
      acks.push({ id: op.id, status: "rejected" });
    }
  }

  if (ops.length > 0) {
    await SyncOpRepository.delete({
      user: { id: user.id },
      createdAt: LessThan(new Date(nowMs - OP_RETENTION_MS)),
    });
  }

  return { acks, ids, retry };
};

export default processOps;
