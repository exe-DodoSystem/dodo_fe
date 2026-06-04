import axiosClient from './axiosClient';

export interface BillingOrder {
  id: string;
  tenantName: string;
  billingOrderNumber: string;
  billingDate: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// GET /api/BillingOrder/me/billing-orders
export async function getBillingOrders(): Promise<BillingOrder[]> {
  const response = await axiosClient.get<BillingOrder[]>('/api/BillingOrder/me/billing-orders');
  return response.data;
}

// POST /api/Payment/create?orderId={id}
export async function createPaymentUrl(orderId: string): Promise<string> {
  const response = await axiosClient.post<string>(
    `/api/Payment/create?orderId=${orderId}`
  );
  return response.data;
}

// POST /api/Payment/simulate/vnpay/success?orderId={id}
export async function simulatePaymentSuccess(orderId: string): Promise<void> {
  await axiosClient.post(`/api/Payment/simulate/vnpay/success?orderId=${orderId}`);
}
