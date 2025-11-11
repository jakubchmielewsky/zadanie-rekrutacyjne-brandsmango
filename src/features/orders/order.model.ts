import mongoose, { InferSchemaType } from "mongoose";

const orderSchema = new mongoose.Schema({
  _id: String,
  products: [
    {
      _id: String,
      quantity: { type: Number, required: true },
    },
  ],
  totalWorth: { type: Number, required: true },
  orderChangeDate: { type: Date, required: true },
});

export type OrderDocument = InferSchemaType<typeof orderSchema>;

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
