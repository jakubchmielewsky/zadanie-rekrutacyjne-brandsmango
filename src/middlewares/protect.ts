import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import AppError from "../utils/AppError";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== env.API_KEY) return next(new AppError("Unauthorized", 401));

  next();
};
