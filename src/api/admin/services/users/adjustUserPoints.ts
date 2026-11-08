import ticketBalance from "@/api/prizes/services/ticketBalance";
import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { text } from "../../helpers";
import logAction from "../actions/logAction";
import loadUser from "./loadUser";

const adjustUserPoints = (admin: UserEntity, id: number, body: Record<string, unknown> | undefined, manager?: EntityManager) => {
  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 100000) throw ApiError("amount must be a non-zero whole number");
  const reason = text(body?.reason, "reason", { optional: true, max: 200 });

  return inTransaction(manager, async (m) => {
    const user = await loadUser(id, m);
    const current = await ticketBalance(id, m);
    if (current + amount < 0) throw ApiError(`${user.username} only has ${current} points`);
    await m.save(TicketEntryEntity, { user: { id } as UserEntity, amount, reason: TicketReason.ADMIN });
    await logAction(admin, "user", id, `${amount > 0 ? "Gave" : "Removed"} ${Math.abs(amount)} points ${amount > 0 ? "to" : "from"} ${user.username}${reason ? `: ${reason}` : ""}`, m);
    return { balance: current + amount };
  });
};

export default adjustUserPoints;
