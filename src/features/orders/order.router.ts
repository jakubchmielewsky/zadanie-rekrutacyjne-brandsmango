import Express from "express";
import { getOrderById, getOrders } from "./order.controller";
import { protect } from "../../middlewares/protect";

const ordersRouter = Express.Router();

ordersRouter.use(protect);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Endpoints for fetching and managing orders
 */

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     summary: Retrieve a list of orders (JSON or CSV)
 *     tags:
 *       - Orders
 *     security:
 *       - ApiKeyAuth: []
 *     description: >
 *       Returns a list of orders from the database.
 *       Supports filtering by order value (minWorth, maxWorth)
 *       and exporting results as CSV when Accept: text/csv.
 *     parameters:
 *       - in: query
 *         name: minWorth
 *         schema:
 *           type: number
 *         example: 10
 *       - in: query
 *         name: maxWorth
 *         schema:
 *           type: number
 *         example: 1000
 *       - in: header
 *         name: Accept
 *         schema:
 *           type: string
 *         example: text/csv
 *       - in: header
 *         name: x-api-key
 *         schema:
 *           type: string
 *         required: true
 *         example: YXBwbGljYXRpb24xNjpYe...
 *     responses:
 *       200:
 *         description: OK – JSON or CSV depending on Accept header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdersResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized – missing or invalid x-api-key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
ordersRouter.get("/", getOrders);

/**
 * @openapi
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: Retrieve a single order by its identifier
 *     tags:
 *       - Orders
 *     security:
 *       - ApiKeyAuth: []
 *     description: |
 *       Returns a single order from the database (see `Order` schema).
 *       Use this endpoint to fetch details of a specific order, including:
 *       product list, total value, status, and timestamps.
 *
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order identifier (`_id` field in the database, e.g. `iaisystem-3`).
 *         example: iaisystem-3
 *       - in: header
 *         name: x-api-key
 *         schema:
 *           type: string
 *         required: true
 *         description: API key required for request authorization.
 *         example: YXBwb...
 *
 *     responses:
 *       '200':
 *         description: Order found successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *             example:
 *               status: "success"
 *               data:
 *                 _id: "iaisystem-3"
 *                 products:
 *                   - _id: "2"
 *                     quantity: 12
 *                 totalWorth: 2.56
 *                 orderStatus: "new"
 *
 *       '401':
 *         description: Unauthorized — missing or invalid `x-api-key`.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Unauthorized"
 *
 *       '404':
 *         description: Order with the given `orderId` not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Order not found"
 *
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Something went wrong!"
 */
ordersRouter.get("/:orderId", getOrderById);

export default ordersRouter;
