import pino from "pino";
import path from "path";
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";

const logDir = path.join(process.cwd(), "logs");
console.log(logDir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const prodDestination = pino.destination({
  dest: path.join(logDir, "app.log"),
  //minLength: 4096,
  sync: false,
});

const devTransport = {
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:standard",
    singleLine: false,
  },
};

export const logger = pino(
  {
    level: isProd ? "info" : "debug",
    transport: isProd ? undefined : devTransport,
  },
  isProd ? prodDestination : undefined
);

export const jobLogger = logger.child({ module: "sync-orders-job" });
export const ordersLogger = logger.child({ module: "orders-service" });
export const dbLogger = logger.child({ module: "mongo" });
export const externalApiLogger = logger.child({ module: "idosell-api" });
export const globalErrorLogger = logger.child({ module: "express-error" });
export const processLogger = logger.child({ module: "process" });
