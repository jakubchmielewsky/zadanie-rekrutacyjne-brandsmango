export type APIOrder = {
  orderId: string;
  orderDetails: {
    orderStatus: string;
    orderChangeDate: string;
    productsResults: {
      productId: string;
      productQuantity: number;
      productOrderPrice: number;
    }[];
  };
};
