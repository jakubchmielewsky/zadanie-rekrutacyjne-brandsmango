import Express from "express";
import { getOrderById, listOrders } from "./order.controller";
import { protect } from "../../middlewares/protect";

const ordersRouter = Express.Router();

ordersRouter.use(protect);

ordersRouter.get("/", listOrders);

ordersRouter.get("/:orderId", getOrderById);

export default ordersRouter;
