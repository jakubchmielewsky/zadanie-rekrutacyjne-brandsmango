import {
  OrderSchema,
  GetOrdersQuerySchema,
  GetOrderByIdParamsSchema,
  GetOrdersHeadersSchema,
} from "./order.types";
import { registry } from "../../config/openapi";

registry.register("Order", OrderSchema);

registry.registerPath({
  method: "get",
  path: "/api/v1/orders",
  tags: ["Orders"],
  request: {
    query: GetOrdersQuerySchema,
    headers: GetOrdersHeadersSchema,
  },
  responses: {
    200: {
      description: "List of orders (JSON or CSV depending on Accept header)",
      content: {
        "application/json": {
          schema: OrderSchema.array(),
        },
        "text/csv": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/orders/{orderId}",
  tags: ["Orders"],
  request: {
    params: GetOrderByIdParamsSchema,
  },
  responses: {
    200: {
      description: "Single order",
      content: {
        "application/json": {
          schema: OrderSchema,
        },
      },
    },
  },
});
