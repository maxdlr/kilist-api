import { langOf } from "@/i18n";
import { isMessageCode, translate } from "@/i18n/messages";
import { NextFunction, Request, Response } from "express";

type HandledError = Error | TApiError | TServiceError | TValidationError;

const serviceErrorHandler = (
  err: HandledError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  const lang = langOf(req);
  const status = (err as any)?.status || 500;
  const code = (err as TApiError)?.code;
  const validation = (err as TValidationError)?.validation?.map((entry) => ({
    ...entry,
    messages: entry.messages.map((message) =>
      isMessageCode(message) ? translate(message, lang) : message,
    ),
  }));
  const firstValidation = validation?.flatMap((entry) => entry.messages)[0];

  return ApiResponse(res, {
    status,
    message: code
      ? translate(code, lang)
      : firstValidation ?? translate("errors.generic", lang),
    ...(code && { code }),
    ...(validation && { errors: validation }),
    error: {
      endpoint: req.originalUrl,
      detail: err?.message || undefined,
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
