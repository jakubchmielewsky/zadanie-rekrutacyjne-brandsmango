import Express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import ExpressMongoSanitize from "express-mongo-sanitize";
import { setupSwagger } from "./config/swagger";
import hpp from "hpp";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import AppError from "./utils/AppError";
import { env } from "./config/env";
import { xss } from "express-xss-sanitizer";
import ordersRouter from "./features/orders/order.router";

const app = Express();

if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

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

//testing middleware
app.use("/", (req, res, next) => {
  //console.log("Data received:", req.body);
  //console.log("Cookies received:", req.cookies);

  next();
});

setupSwagger(app);

app.use("/api/v1/orders", ordersRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

export default app;
