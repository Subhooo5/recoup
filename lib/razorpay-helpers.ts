import type { Orders } from "razorpay/dist/types/orders";
import type { Payments } from "razorpay/dist/types/payments";
import type { Plans } from "razorpay/dist/types/plans";
import type { PaymentLinks } from "razorpay/dist/types/paymentLink";
import type { Subscriptions } from "razorpay/dist/types/subscriptions";

import { razorpay } from "@/lib/razorpay";

export type RazorpayOrderStatus = Orders.RazorpayOrder["status"];

export type FetchAllOrdersParams = {
  status?: RazorpayOrderStatus;
  from?: number;
  to?: number;
  count?: number;
  skip?: number;
};

export type FetchAllOrdersResponse = {
  entity: string;
  count: number;
  items: Orders.RazorpayOrder[];
};

export const createOrder = (
  params: Orders.RazorpayOrderCreateRequestBody,
): Promise<Orders.RazorpayOrder> => razorpay.orders.create(params);

export const fetchOrder = (orderId: string): Promise<Orders.RazorpayOrder> =>
  razorpay.orders.fetch(orderId);

export const fetchAllOrders = async (
  params: FetchAllOrdersParams = {},
): Promise<FetchAllOrdersResponse> => {
  const { status, ...paginationParams } = params;
  const response = await razorpay.orders.all(paginationParams);

  if (!status) {
    return response;
  }

  const items = response.items.filter((order) => order.status === status);

  return { ...response, items, count: items.length };
};

export const fetchPayment = (
  paymentId: string,
): Promise<Payments.RazorpayPayment> => razorpay.payments.fetch(paymentId);

export const createPaymentLink = (
  params: PaymentLinks.RazorpayPaymentLinkCreateRequestBody,
): Promise<PaymentLinks.RazorpayPaymentLink> =>
  razorpay.paymentLink.create(params);

export const fetchPlan = (planId: string): Promise<Plans.RazorPayPlans> =>
  razorpay.plans.fetch(planId);

export const fetchSubscription = (
  subscriptionId: string,
): Promise<Subscriptions.RazorpaySubscription> =>
  razorpay.subscriptions.fetch(subscriptionId);
