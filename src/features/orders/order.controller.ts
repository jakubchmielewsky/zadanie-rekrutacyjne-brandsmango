import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import * as OrderService from "./order.service";
import { FilterQuery } from "mongoose";
import { OrderDocument } from "./order.model";

export const getOrders = catchAsync(async (req: Request, res: Response) => {
  const { minWorth, maxWorth } = req.query;

  const filter: FilterQuery<OrderDocument> = {};

  if (minWorth || maxWorth) {
    filter.totalWorth = {};
  }

  if (minWorth) {
    filter.totalWorth.$gte = Number(minWorth);
  }

  if (maxWorth) {
    filter.totalWorth.$lte = Number(maxWorth);
  }

  if (req.headers.accept === "text/csv") {
    const csvStream = await OrderService.getOrdersAsCSV(filter);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");

    csvStream.pipe(res);
  } else {
    const orders = await OrderService.getOrders(filter);

    res.status(200).json({ status: "success", data: orders });
  }
});

export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await OrderService.getOrderById(orderId);

  res.status(200).json({ status: "success", data: order });
});
