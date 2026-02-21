import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  requireTyping?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  requireTyping,
  onConfirm,
  onClose,
  danger = false,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState('');

  if (!open) return null;

  const canConfirm = !requireTyping || typed === requireTyping;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setTyped('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`} />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-[var(--color-text-muted)] text-sm mb-4">{message}</p>
        {requireTyping && (
          <div className="mb-4">
            <p className="text-sm mb-2">Type <strong>{requireTyping}</strong> to confirm:</p>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              placeholder={requireTyping}
            />
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50
              ${danger ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-navy)]'}
            `}
          >
            {loading && <LoadingSpinner size="sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
