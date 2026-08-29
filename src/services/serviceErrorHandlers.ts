import { NextFunction, Request, Response } from "express";

type HandledError = Error | TApiError | TCrudError | TValidationError;

const serviceErrorHandler = (
  err: HandledError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  const status = (err as any)?.status || 500;
  const validation = (err as any)?.validation;

  return ApiResponse(res, {
    status,
    message: err?.message || "Something went wrong",
    ...(validation && { errors: validation }),
    error: {
      endpoint: req.originalUrl,
      stack:
        process.env.NODE_ENV !== "production"
          ? process.env.LOG_LEVEL === "debug"
            ? err?.stack
            : undefined
          : undefined,
      traceId: req.headers["x-request-id"] || null,
    },
  });
};

export default serviceErrorHandler;
