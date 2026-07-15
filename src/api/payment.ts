import axiosClient from './axiosClient';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';

export interface BillingOrder {
  id: string;
  tenantName: string;
  billingOrderNumber: string;
  billingDate: string;
  totalAmount: number;
  discountAmount: number | null;
  finalAmount: number | null;
  paymentStatus: PaymentStatus;
  status: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BillingOrderModule {
  id: string;
  billingOrderId: string;
  moduleId: number;
  quantity: number;
  unitPrice: number;
  prorationDays: number | null;
  lineTotal: number;
  createdAt: string;
}

export interface SePayPaymentInfo {
  transferContent: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankCode: string;
  amount: number;
  qrCodeUrl: string;
  orderId: string;
}

export type PaymentResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'sepay'; info: SePayPaymentInfo };

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as UnknownRecord;
}

/** Đọc được cả camelCase và PascalCase từ chuỗi JSON do BE trả về. */
function readCaseInsensitive(record: UnknownRecord, field: string): unknown {
  const matchedKey = Object.keys(record).find(
    (key) => key.toLowerCase() === field.toLowerCase()
  );
  return matchedKey ? record[matchedKey] : undefined;
}

function readRequiredString(record: UnknownRecord, field: string): string {
  const value = readCaseInsensitive(record, field);
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Phản hồi thanh toán thiếu trường ${field}.`);
  }
  return value.trim();
}

function readRequiredNumber(record: UnknownRecord, field: string): number {
  const raw = readCaseInsensitive(record, field);
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Phản hồi thanh toán có trường ${field} không hợp lệ.`);
  }
  return value;
}

function normalizeHttpUrl(value: string, field: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    return url.toString();
  } catch {
    throw new Error(`Phản hồi thanh toán có ${field} không hợp lệ.`);
  }
}

function tryNormalizeHttpUrl(value: string): string | null {
  try {
    return normalizeHttpUrl(value, 'URL');
  } catch {
    return null;
  }
}

function normalizeSePayInfo(payload: UnknownRecord): SePayPaymentInfo {
  return {
    transferContent: readRequiredString(payload, 'transferContent'),
    bankAccountNumber: readRequiredString(payload, 'bankAccountNumber'),
    bankAccountName: readRequiredString(payload, 'bankAccountName'),
    bankCode: readRequiredString(payload, 'bankCode'),
    amount: readRequiredNumber(payload, 'amount'),
    qrCodeUrl: normalizeHttpUrl(
      readRequiredString(payload, 'qrCodeUrl'),
      'qrCodeUrl'
    ),
    orderId: readRequiredString(payload, 'orderId'),
  };
}

/**
 * Chuẩn hóa response của POST /api/Payment/create.
 * Hỗ trợ URL VNPay, chuỗi JSON SePay, JSON bị encode hai lần và object đã được Axios parse.
 */
export function parsePaymentResponse(response: unknown): PaymentResult {
  let payload = response;

  for (let depth = 0; depth < 2 && typeof payload === 'string'; depth += 1) {
    const value = payload.trim();
    if (!value) throw new Error('Phản hồi thanh toán trống.');

    const redirectUrl = tryNormalizeHttpUrl(value);
    if (redirectUrl) return { kind: 'redirect', url: redirectUrl };

    try {
      payload = JSON.parse(value) as unknown;
    } catch {
      throw new Error('Phản hồi thanh toán không phải URL hoặc JSON hợp lệ.');
    }
  }

  const record = asRecord(payload);
  if (!record) {
    throw new Error('Phản hồi thanh toán SePay không đúng định dạng.');
  }

  return { kind: 'sepay', info: normalizeSePayInfo(record) };
}

// GET /api/BillingOrder/me/billing-orders
export async function getBillingOrders(signal?: AbortSignal): Promise<BillingOrder[]> {
  const response = await axiosClient.get<BillingOrder[]>('/api/BillingOrder/me/billing-orders', {
    signal,
  });
  return response.data;
}

// GET /api/BillingOrderModules/me/by-billing-order-id/{billingOrderId}
export async function getBillingOrderModules(
  billingOrderId: string,
  signal?: AbortSignal
): Promise<BillingOrderModule[]> {
  const response = await axiosClient.get<BillingOrderModule[]>(
    `/api/BillingOrderModules/me/by-billing-order-id/${encodeURIComponent(billingOrderId)}`,
    { signal }
  );
  return response.data;
}

// POST /api/Payment/create?orderId={id}
export async function createPayment(orderId: string): Promise<PaymentResult> {
  const response = await axiosClient.post<unknown>('/api/Payment/create', undefined, {
    params: { orderId },
  });
  return parsePaymentResponse(response.data);
}

// Dev-only: POST /api/Payment/simulate/vnpay/success?orderId={id}
export async function simulateVNPaySuccessDev(orderId: string): Promise<void> {
  await axiosClient.post('/api/Payment/simulate/vnpay/success', undefined, {
    params: { orderId },
  });
}

// Dev-only: POST /api/Payment/simulate/sepay/success?orderId={id}
export async function simulateSePaySuccessDev(
  orderId: string,
  transactionCode?: string
): Promise<void> {
  await axiosClient.post('/api/Payment/simulate/sepay/success', undefined, {
    params: { orderId, ...(transactionCode ? { transactionCode } : {}) },
  });
}
