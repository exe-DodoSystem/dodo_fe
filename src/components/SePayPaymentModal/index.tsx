import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { BillingOrder, SePayPaymentInfo } from '../../api/payment';
import { usePaymentStatusPolling } from '../../hooks/usePaymentStatusPolling';
import './payment-modal.css';

interface SePayPaymentModalProps {
  open: boolean;
  payment: SePayPaymentInfo | null;
  onClose: () => void;
  onPaid?: (order: BillingOrder) => void;
  pollingEnabled?: boolean;
}

interface DetailRowProps {
  label: string;
  value: string;
  copyValue?: string;
  copyKey?: string;
  copiedKey: string | null;
  emphasized?: boolean;
  onCopy: (key: string, value: string) => void;
}

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

function DetailRow({
  label,
  value,
  copyValue,
  copyKey,
  copiedKey,
  emphasized = false,
  onCopy,
}: DetailRowProps) {
  return (
    <div className={`sepay-detail-row${emphasized ? ' emphasized' : ''}`}>
      <div>
        <span className="sepay-detail-label">{label}</span>
        <strong className="sepay-detail-value">{value}</strong>
      </div>
      {copyValue && copyKey && (
        <button
          type="button"
          className="sepay-copy-btn"
          onClick={() => onCopy(copyKey, copyValue)}
          aria-label={`Sao chép ${label.toLowerCase()}`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {copiedKey === copyKey ? 'check' : 'content_copy'}
          </span>
          {copiedKey === copyKey ? 'Đã chép' : 'Sao chép'}
        </button>
      )}
    </div>
  );
}

function fallbackCopy(value: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}

export default function SePayPaymentModal({
  open,
  payment,
  onClose,
  onPaid,
  pollingEnabled = true,
}: SePayPaymentModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState('');
  const resetCopyTimerRef = useRef<number | undefined>(undefined);
  const polling = usePaymentStatusPolling({
    orderId: payment?.orderId ?? null,
    enabled: open && pollingEnabled && !!payment,
    onPaid,
  });

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => () => {
    if (resetCopyTimerRef.current !== undefined) {
      window.clearTimeout(resetCopyTimerRef.current);
    }
  }, []);

  if (!open || !payment) return null;

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleCopy = async (key: string, value: string) => {
    setCopyError('');
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(value);
          copied = true;
        } catch {
          // Clipboard API có thể bị chặn bởi browser permission; thử fallback DOM.
        }
      }
      if (!copied) copied = fallbackCopy(value);
      if (!copied) throw new Error('Copy failed');

      setCopiedKey(key);
      if (resetCopyTimerRef.current !== undefined) {
        window.clearTimeout(resetCopyTimerRef.current);
      }
      resetCopyTimerRef.current = window.setTimeout(() => setCopiedKey(null), 1_800);
    } catch {
      setCopyError('Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.');
    }
  };

  const renderPollingStatus = () => {
    if (polling.status === 'paid') {
      return (
        <div className="sepay-poll-status success" role="status">
          <span className="material-symbols-outlined">check_circle</span>
          Thanh toán thành công! Dịch vụ đang được kích hoạt.
        </div>
      );
    }
    if (polling.status === 'failed') {
      return (
        <div className="sepay-poll-status error" role="alert">
          <span className="material-symbols-outlined">error</span>
          Giao dịch không thành công. Vui lòng thử lại.
        </div>
      );
    }
    if (polling.status === 'timeout') {
      return (
        <div className="sepay-poll-status warning" role="status">
          <span className="material-symbols-outlined">schedule</span>
          Chưa nhận được xác nhận. Bạn có thể đóng cửa sổ và kiểm tra lại sau.
        </div>
      );
    }
    return (
      <div className="sepay-poll-status pending" role="status">
        <span className="sepay-pulse" aria-hidden="true" />
        {polling.error
          ? 'Kết nối kiểm tra tạm thời gián đoạn, hệ thống sẽ tự thử lại.'
          : 'Đang chờ ngân hàng xác nhận thanh toán...'}
      </div>
    );
  };

  return (
    <div className="sepay-overlay" onMouseDown={handleOverlayClick}>
      <section
        className="sepay-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sepay-modal-title"
      >
        <header className="sepay-modal-header">
          <div>
            <p className="sepay-modal-eyebrow">Thanh toán qua SePay</p>
            <h2 id="sepay-modal-title">Quét mã VietQR để thanh toán</h2>
          </div>
          <button type="button" className="sepay-close-btn" onClick={onClose} aria-label="Đóng">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>

        <div className="sepay-modal-body">
          <div className="sepay-qr-panel">
            <div className="sepay-qr-frame">
              <img src={payment.qrCodeUrl} alt="Mã VietQR thanh toán đơn hàng" />
            </div>
            <p>Mở ứng dụng ngân hàng và quét mã QR</p>
            <span>Mã đã bao gồm số tiền và nội dung chuyển khoản</span>
          </div>

          <div className="sepay-details">
            <DetailRow
              label="Ngân hàng nhận"
              value={payment.bankCode}
              copyValue={payment.bankCode}
              copyKey="bank"
              copiedKey={copiedKey}
              onCopy={handleCopy}
            />
            <DetailRow
              label="Số tài khoản"
              value={payment.bankAccountNumber}
              copyValue={payment.bankAccountNumber}
              copyKey="account"
              copiedKey={copiedKey}
              onCopy={handleCopy}
            />
            <DetailRow
              label="Chủ tài khoản"
              value={payment.bankAccountName}
              copyValue={payment.bankAccountName}
              copyKey="account-name"
              copiedKey={copiedKey}
              onCopy={handleCopy}
            />
            <DetailRow
              label="Số tiền"
              value={formatVnd(payment.amount)}
              copyValue={String(payment.amount)}
              copyKey="amount"
              copiedKey={copiedKey}
              onCopy={handleCopy}
            />
            <DetailRow
              label="Nội dung chuyển khoản"
              value={payment.transferContent}
              copyValue={payment.transferContent}
              copyKey="content"
              copiedKey={copiedKey}
              emphasized
              onCopy={handleCopy}
            />
          </div>
        </div>

        <div className="sepay-business-notice">
          <span className="material-symbols-outlined" aria-hidden="true">warning</span>
          <p>
            Vui lòng nhập <strong>chính xác nội dung chuyển khoản</strong> phía trên để hệ
            thống tự động kích hoạt dịch vụ sau 1–3 phút.
          </p>
        </div>

        {copyError && <p className="sepay-copy-error" role="alert">{copyError}</p>}

        <footer className="sepay-modal-footer">
          {renderPollingStatus()}
          <button type="button" className="sepay-done-btn" onClick={onClose}>
            {polling.status === 'paid' ? 'Hoàn tất' : 'Đóng'}
          </button>
        </footer>
      </section>
    </div>
  );
}
