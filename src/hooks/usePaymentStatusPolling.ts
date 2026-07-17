import { useEffect, useRef, useState } from 'react';
import { getBillingOrders, type BillingOrder } from '../api/payment';

export type PaymentPollingStatus = 'idle' | 'polling' | 'paid' | 'failed' | 'timeout';

interface UsePaymentStatusPollingOptions {
  orderId: string | null;
  enabled: boolean;
  intervalMs?: number;
  timeoutMs?: number;
  onPaid?: (order: BillingOrder) => void;
}

interface PaymentPollingSnapshot {
  orderId: string | null;
  status: PaymentPollingStatus;
  order: BillingOrder | null;
  error: string | null;
}

export interface PaymentPollingResult {
  status: PaymentPollingStatus;
  order: BillingOrder | null;
  error: string | null;
}

const IDLE_RESULT: PaymentPollingResult = {
  status: 'idle',
  order: null,
  error: null,
};

/**
 * Poll trạng thái hóa đơn tuần tự để không tạo request chồng nhau.
 * Request đang chạy sẽ bị hủy khi modal đóng, order đổi hoặc component unmount.
 */
export function usePaymentStatusPolling({
  orderId,
  enabled,
  intervalMs = 5_000,
  timeoutMs = 10 * 60_000,
  onPaid,
}: UsePaymentStatusPollingOptions): PaymentPollingResult {
  const onPaidRef = useRef(onPaid);
  const [snapshot, setSnapshot] = useState<PaymentPollingSnapshot>({
    orderId: null,
    status: 'idle',
    order: null,
    error: null,
  });

  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  useEffect(() => {
    if (!enabled || !orderId) return;

    const controller = new AbortController();
    const startedAt = Date.now();
    const delay = Math.max(1_000, intervalMs);
    const maxDuration = Math.max(delay, timeoutMs);
    let timerId: number | undefined;
    let cancelled = false;
    let terminal = false;
    let inFlight = false;

    const poll = async () => {
      if (cancelled || terminal || inFlight) return;

      if (Date.now() - startedAt >= maxDuration) {
        terminal = true;
        setSnapshot((previous) => ({
          orderId,
          status: 'timeout',
          order: previous.orderId === orderId ? previous.order : null,
          error: null,
        }));
        return;
      }

      inFlight = true;
      setSnapshot((previous) => ({
        orderId,
        status: 'polling',
        order: previous.orderId === orderId ? previous.order : null,
        error: null,
      }));

      try {
        const orders = await getBillingOrders(controller.signal);
        if (cancelled) return;

        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          throw new Error('Không tìm thấy hóa đơn đang thanh toán.');
        }

        const paymentStatus = String(order.paymentStatus).toLowerCase();
        if (paymentStatus === 'paid' || paymentStatus === 'success') {
          terminal = true;
          setSnapshot({ orderId, status: 'paid', order, error: null });
          onPaidRef.current?.(order);
          return;
        }

        if (paymentStatus === 'failed') {
          terminal = true;
          setSnapshot({ orderId, status: 'failed', order, error: null });
          return;
        }

        setSnapshot({ orderId, status: 'polling', order, error: null });
      } catch (error: unknown) {
        if (cancelled || controller.signal.aborted) return;
        const message = error instanceof Error
          ? error.message
          : 'Tạm thời không thể kiểm tra trạng thái thanh toán.';
        setSnapshot((previous) => ({
          orderId,
          status: 'polling',
          order: previous.orderId === orderId ? previous.order : null,
          error: message,
        }));
      } finally {
        inFlight = false;
        if (!cancelled && !terminal) {
          timerId = window.setTimeout(() => void poll(), delay);
        }
      }
    };

    // Khởi chạy ngoài effect callback để tuân theo vòng đời effect và tránh render dây chuyền.
    timerId = window.setTimeout(() => void poll(), 0);

    return () => {
      cancelled = true;
      controller.abort();
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [enabled, intervalMs, orderId, timeoutMs]);

  if (!enabled || !orderId) return IDLE_RESULT;
  if (snapshot.orderId !== orderId) {
    return { status: 'polling', order: null, error: null };
  }

  return {
    status: snapshot.status,
    order: snapshot.order,
    error: snapshot.error,
  };
}
