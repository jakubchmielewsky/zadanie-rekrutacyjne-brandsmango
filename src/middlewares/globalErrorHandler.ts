import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import { env } from "../config/env";
import { ZodError } from "zod";

const handleDuplicateFieldsErrorDB = (err: any) => {
  const value = Object.values(err.keyValue).join(", ");

  const message = `Duplicate field value: ${value} `;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);

  const message = `Invalid input data. ${errors.join()}`;

  return new AppError(message, 400);
};

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleZodError = (err: ZodError) => {
  const messages = err.issues
    .map((issue: any) => `${issue.path.join(".")} — ${issue.message}`)
    .join("; ");

  return new AppError(`Invalid input: ${messages}`, 400);
};

const sendErrorDevelopment = (err: any, req: Request, res: Response) => {
  return res.status(err.statusCode).json({
    error: err.message,
    details: err,
  });
};

const sendErrorProduction = (err: any, req: Request, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  } else {
    return res.status(500).json({
      error: "Something went wrong!",
    });
  }
};

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let errorCopy = { ...err };
  errorCopy.statusCode = err.statusCode || 500;
  errorCopy.message = err.message || "Something went wrong!";
  errorCopy.stack = err.stack;

  if (err.code === 11000) errorCopy = handleDuplicateFieldsErrorDB(err);
  if (err.name === "ValidationError") errorCopy = handleValidationErrorDB(err);
  if (err.name === "CastError") errorCopy = handleCastErrorDB(err);
  if (err instanceof ZodError) errorCopy = handleZodError(err);

  if (env.NODE_ENV !== "production") {
    return sendErrorDevelopment(errorCopy, req, res);
  }

  sendErrorProduction(errorCopy, req, res);
};

export default globalErrorHandler;
