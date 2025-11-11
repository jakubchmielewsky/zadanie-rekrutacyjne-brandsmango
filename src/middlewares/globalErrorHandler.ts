import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import { env } from "../config/env";

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

const sendErrorDevelopment = (err: any, req: Request, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    err: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProduction = (err: any, req: Request, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //generic error
    return res.status(500).json({
      status: "error",
      message: "Something went wrong!",
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
  errorCopy.status = err.status || "error";
  errorCopy.message = err.message || "Something went wrong!";

  if (env.NODE_ENV === "development") {
    return sendErrorDevelopment(errorCopy, req, res);
  }

  if (err.code === 11000) errorCopy = handleDuplicateFieldsErrorDB(err);
  if (err.name === "ValidationError") errorCopy = handleValidationErrorDB(err);
  if (err.name === "CastError") errorCopy = handleCastErrorDB(err);

  sendErrorProduction(errorCopy, req, res);
};

export default globalErrorHandler;
