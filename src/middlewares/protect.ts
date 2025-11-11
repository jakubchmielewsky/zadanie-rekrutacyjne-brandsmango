import { env } from "../config/env";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";

export const protect = catchAsync((req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== env.API_KEY) return next(new AppError("Unauthorized", 401));

  next();
});
