import Express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { setupSwagger } from "./config/swagger";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import AppError from "./utils/AppError";
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
app.use(helmet());

app.use("/api/v1/orders", ordersRouter);

setupSwagger(app);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

export default app;
