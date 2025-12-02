import pinoHttp from "pino-http";
import { logger } from "../config/logger";
import { randomUUID } from "crypto";

export const requestLogger = pinoHttp({
  logger,
  genReqId: () => randomUUID(),
  customSuccessMessage: (req, res) => {
    return `Request handled successfully`;
  },
  customErrorMessage: (req, res, error) => {
    return `Request failed: ${error.message}`;
  },
  customLogLevel: (req, res, error) => {
    if (error) return "error";
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});
