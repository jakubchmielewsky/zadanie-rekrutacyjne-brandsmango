import { z } from "../../config/zod";

export const OrderProductSchema = z.object({
  _id: z.string(),
  quantity: z.number().int().nonnegative(),
});

export const OrderSchema = z.object({
  _id: z.string(),
  products: z.array(OrderProductSchema),
  totalWorth: z.number().nonnegative(),
  orderStatus: z.string(),
});

export const GetOrdersQuerySchema = z.object({
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
});

export const GetOrderByIdParamsSchema = z.object({
  orderId: z.string(),
});

export const GetOrdersHeadersSchema = z.object({
  Accept: z.enum(["application/json", "text/csv"]).optional(),
});

export type Order = z.infer<typeof OrderSchema>;
