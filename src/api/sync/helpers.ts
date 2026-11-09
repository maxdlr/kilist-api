export const MAX_OPS_PER_SYNC = 100;
export const MAX_OP_AGE_MS = 30 * 24 * 3600000;
export const MAX_REWARD_AGE_MS = 7 * 24 * 3600000;
export const OP_RETENTION_MS = 60 * 24 * 3600000;

export type SyncOpInput = {
  id: string;
  type: string;
  at: string;
  payload?: Record<string, any>;
};

export type SyncAck = {
  id: string;
  status: "applied" | "rejected";
};

export const resolveOpTime = (rawAt: unknown, skewMs: number, nowMs: number) => {
  const at = Date.parse(String(rawAt));
  if (Number.isNaN(at)) return new Date(nowMs);
  return new Date(Math.min(at + skewMs, nowMs));
};

export const clockSkew = (sentAt: unknown, nowMs: number) => {
  const sent = Date.parse(String(sentAt));
  return Number.isNaN(sent) ? 0 : nowMs - sent;
};

export const isRejection = (error: unknown) =>
  isApiError(error) && error.status >= 400 && error.status < 500;
