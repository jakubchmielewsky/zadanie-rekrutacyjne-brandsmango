import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import * as OrderService from "./order.service";
import { FilterQuery } from "mongoose";
import { OrderDocument } from "./order.model";
import { GetOrderByIdParamsSchema, GetOrdersQuerySchema } from "./order.types";

export const getOrders = catchAsync(async (req: Request, res: Response) => {
  const { minWorth, maxWorth } = GetOrdersQuerySchema.parse(req.query);

  const filter: FilterQuery<OrderDocument> = {};

  if (minWorth || maxWorth) {
    filter.totalWorth = {};
    if (minWorth) filter.totalWorth.$gte = minWorth;
    if (maxWorth) filter.totalWorth.$lte = maxWorth;
  }

  if (req.headers.accept === "text/csv") {
    const csvStream = OrderService.getOrdersAsCSV(filter);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");

    csvStream.pipe(res);
  } else {
    const orders = await OrderService.getOrders(filter);

    res.status(200).json(orders);
  }
});

export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = GetOrderByIdParamsSchema.parse(req.params);

  const order = await OrderService.getOrderById(orderId);

  res.status(200).json(order);
});
