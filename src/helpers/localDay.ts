const MAX_TZ_OFFSET_MINUTES = 840;

export const parseTzOffset = (value: unknown): number => {
  const offset = Number(value);
  return Number.isFinite(offset) && Math.abs(offset) <= MAX_TZ_OFFSET_MINUTES
    ? offset
    : 0;
};

export const toLocalDay = (date: Date, tzOffset: number) =>
  new Date(date.getTime() - tzOffset * 60000).toISOString().slice(0, 10);
