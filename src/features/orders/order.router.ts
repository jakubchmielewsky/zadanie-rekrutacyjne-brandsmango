import Express from "express";
import { getOrderById, getOrders } from "./order.controller";

const ordersRouter = Express.Router();

ordersRouter.get("/", getOrders);
ordersRouter.get("/:orderId", getOrderById);

export default ordersRouter;
