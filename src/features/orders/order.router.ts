import Express from "express";
import { getOrderById, getOrders } from "./order.controller";
import { protect } from "../../middlewares/protect";

const ordersRouter = Express.Router();

ordersRouter.use(protect);

ordersRouter.get("/", getOrders);

ordersRouter.get("/:orderId", getOrderById);

export default ordersRouter;
