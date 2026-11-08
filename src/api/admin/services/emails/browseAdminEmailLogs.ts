import EmailLogEntity from "@/entities/EmailLogEntity";
import EmailLogRepository from "@/repositories/EmailLogRepository";
import findManager from "@/utils/findManager";
import { Brackets, EntityManager } from "typeorm";
import { idOf, pageOf } from "../../helpers";

const STATUSES = ["sent", "failed", "not_configured"];

const browseAdminEmailLogs = async (query: Record<string, unknown>, manager?: EntityManager) => {
  const { offset, limit } = pageOf(query);
  const qb = findManager(EmailLogRepository, manager)
    .createQueryBuilder(EmailLogEntity, "log")
    .leftJoinAndSelect("log.user", "user")
    .orderBy("log.id", "DESC");

  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    qb.andWhere(
      new Brackets((where) =>
        where.where("log.recipient LIKE :search", { search: `%${search}%` }).orWhere("user.username LIKE :search"),
      ),
    );
  }
  if (query.userId) qb.andWhere("user.id = :userId", { userId: idOf(query.userId, "userId") });
  if (typeof query.status === "string" && STATUSES.includes(query.status)) {
    qb.andWhere("log.status = :status", { status: query.status });
  }

  const [logs, total] = await qb.skip(offset).take(limit).getManyAndCount();

  return {
    total,
    items: logs.map((log) => ({
      id: log.id,
      emailId: log.emailId,
      recipient: log.recipient,
      lang: log.lang,
      status: log.status,
      error: log.error ?? null,
      at: log.createdAt,
      user: log.user ? { id: log.user.id, username: log.user.username } : null,
    })),
  };
};

export default browseAdminEmailLogs;
