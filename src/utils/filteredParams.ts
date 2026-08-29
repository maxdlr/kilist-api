export const filteredParams = (params: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined),
  );
