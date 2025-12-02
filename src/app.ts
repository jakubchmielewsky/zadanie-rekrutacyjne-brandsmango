import Express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import ExpressMongoSanitize from "express-mongo-sanitize";
import { setupSwagger } from "./config/swagger";
import hpp from "hpp";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import AppError from "./utils/AppError";
import { xss } from "express-xss-sanitizer";
import ordersRouter from "./features/orders/order.router";
import { requestLogger } from "./middlewares/requestLogger";

const app = Express();

app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.use(Express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use(helmet());
app.use(ExpressMongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ["minWorth", "maxWorth"] }));

app.use("/api/v1/orders", ordersRouter);

setupSwagger(app);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

export default app;
