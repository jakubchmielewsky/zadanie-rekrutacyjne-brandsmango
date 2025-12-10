import mongoose, { InferSchemaType } from "mongoose";

const orderSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  products: [
    {
      _id: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalWorth: { type: Number, required: true },
  orderStatus: { type: String, required: true },
  orderChangeDate: { type: Date, required: true },
});

export type OrderDocument = InferSchemaType<typeof orderSchema>;

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
