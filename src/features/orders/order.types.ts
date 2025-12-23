import { z } from "../../config/zod";

export const OrderProductSchema = z.object({
  _id: z.number(),
  quantity: z.number().int().nonnegative(),
});

export const OrderSchema = z.object({
  _id: z.string(),
  products: z.array(OrderProductSchema),
  totalWorth: z.number().nonnegative(),
  orderStatus: z.string(),
});

export const GetOrdersQuerySchema = z
  .object({
    minWorth: z
      .string()
      .transform(Number)
      .refine((v) => !isNaN(v), { message: "minWorth must be a number" })
      .optional(),
    maxWorth: z
      .string()
      .transform(Number)
      .refine((v) => !isNaN(v), { message: "maxWorth must be a number" })
      .optional(),
  })
  .strict();

export const GetOrderByIdParamsSchema = z
  .object({
    orderId: z.string(),
  })
  .strict();

export const GetOrdersHeadersSchema = z.object({
  accept: z.enum(["application/json", "text/csv"]).optional(),
});

export const APIOrderSchema = z.object({
  orderId: z.string(),
  orderDetails: z.object({
    orderStatus: z.string(),
    orderChangeDate: z.string(),
    productsResults: z.array(
      z.object({
        productId: z.number(),
        productQuantity: z.number(),
        productOrderPrice: z.number(),
      })
    ),
  }),
});

export const APIOrderListSchema = z.object({
  Results: z.array(APIOrderSchema).optional(),
});

export type APIOrder = z.infer<typeof APIOrderSchema>;
export type Order = z.infer<typeof OrderSchema>;
