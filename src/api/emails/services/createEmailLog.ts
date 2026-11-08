import EmailLogEntity, { EmailLogStatus } from "@/entities/EmailLogEntity";
import UserEntity from "@/entities/UserEntity";
import EmailLogRepository from "@/repositories/EmailLogRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const MAX_ERROR_LENGTH = 500;

const createEmailLog = (
  log: {
    recipient: string;
    emailId: string;
    lang: string;
    status: EmailLogStatus;
    userId?: number;
    error?: string;
  },
  manager?: EntityManager,
) =>
  findManager(EmailLogRepository, manager).save(EmailLogEntity, {
    recipient: log.recipient,
    emailId: log.emailId,
    lang: log.lang,
    status: log.status,
    user: log.userId ? ({ id: log.userId } as UserEntity) : null,
    error: log.error?.slice(0, MAX_ERROR_LENGTH) ?? null,
  });

export default createEmailLog;
