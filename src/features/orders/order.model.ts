import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  _id: String,
  products: [
    {
      _id: String,
      quantity: { type: Number, required: true },
    },
  ],
  totalWorth: { type: Number, required: true },
  orderStatus: { type: String, required: true },
  orderChangeDate: { type: Date, required: true },
});

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
