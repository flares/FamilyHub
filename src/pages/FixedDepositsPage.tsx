import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import DataCard from '../components/DataCard';
import FormModal from '../components/FormModal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrency } from '../hooks/useCurrency';
import { formatDate, getMaturityStatus, formatMaturityCountdown } from '../utils/dates';
import type { FixedDeposit, FieldConfig } from '../types';

const FIELDS: FieldConfig[] = [
  { name: 'bank', label: 'Bank', type: 'text', required: true, placeholder: 'e.g. SBI' },
  { name: 'accountName', label: 'Account Holder Name', type: 'text', required: true },
  { name: 'fdNumber', label: 'FD Number', type: 'text' },
  { name: 'principalAmount', label: 'Principal Amount (₹)', type: 'number', required: true },
  { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true, step: 0.01 },
  { name: 'startDate', label: 'Start Date', type: 'date', required: true, half: true },
  { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true, half: true },
  { name: 'maturityAmount', label: 'Maturity Amount (₹)', type: 'number' },
  { name: 'interestPayout', label: 'Interest Payout', type: 'select',
    options: [
      { value: 'cumulative', label: 'Cumulative' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'yearly', label: 'Yearly' },
    ]},
  { name: 'autoRenew', label: 'Auto Renew', type: 'checkbox' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const STATUS_BADGE = {
  active: { label: 'Active', variant: 'green' as const },
  maturing: { label: 'Maturing Soon', variant: 'yellow' as const },
  matured: { label: 'Matured', variant: 'red' as const },
};

export default function FixedDepositsPage() {
  const { data, loading, add, update, remove } = useStore<'fixedDeposits'>('fixedDeposits');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<FixedDeposit | null>(null);

  const { formatCurrency } = useCurrency();
  const fds = (data as FixedDeposit[]).sort((a, b) =>
    new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime()
  );

  const totalPrincipal = fds.reduce((s, fd) => s + fd.principalAmount, 0);
  const totalMaturity = fds.reduce((s, fd) => s + (fd.maturityAmount || fd.principalAmount), 0);
  const avgRate = fds.length > 0
    ? fds.reduce((s, fd) => s + fd.interestRate * fd.principalAmount, 0) / totalPrincipal
    : 0;

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editItem) {
      await update(editItem.id, formData as Partial<FixedDeposit>);
    } else {
      await add(formData as Omit<FixedDeposit, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setEditItem(null);
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-3">
      {/* Summary Bar */}
      <div className="card bg-[var(--color-navy)] text-white">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-white/60 text-xs mb-1">Total Invested</p>
            <p className="currency font-semibold text-sm">{formatCurrency(totalPrincipal)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Maturity Value</p>
            <p className="currency font-semibold text-sm" style={{ color: 'var(--color-gold)' }}>{formatCurrency(totalMaturity)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Avg Rate</p>
            <p className="font-semibold text-sm">{totalPrincipal > 0 ? avgRate.toFixed(1) : '0'}%</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">All Fixed Deposits</h2>
        <span className="badge badge-navy">{fds.length}</span>
      </div>

      {fds.length === 0 ? (
        <EmptyState icon="💰" title="No FDs yet" description="Add your fixed deposits to track them." />
      ) : (
        fds.map(fd => {
          const status = getMaturityStatus(fd.maturityDate);
          const badge = STATUS_BADGE[status];
          return (
            <DataCard
              key={fd.id}
              title={`${fd.bank} — ${fd.fdNumber || 'No FD#'}`}
              subtitle={fd.accountName}
              badges={[
                { label: `${fd.interestRate}%`, variant: 'gold' },
                { label: fd.interestPayout, variant: 'navy' },
                badge,
              ]}
              rightContent={
                <div className="text-right">
                  <p className="currency font-semibold text-sm">{formatCurrency(fd.principalAmount)}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">principal</p>
                </div>
              }
              onEdit={() => { setEditItem(fd); setShowForm(true); }}
              onDelete={() => remove(fd.id)}
              expandedContent={
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Start Date</span>
                    <span>{formatDate(fd.startDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Maturity Date</span>
                    <span>{formatDate(fd.maturityDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Countdown</span>
                    <span className={status === 'matured' ? 'text-[var(--color-danger)]' : status === 'maturing' ? 'text-[var(--color-warning)]' : 'text-[var(--color-positive)]'}>
                      {formatMaturityCountdown(fd.maturityDate)}
                    </span>
                  </div>
                  {fd.maturityAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Maturity Amount</span>
                      <span className="currency font-medium text-[var(--color-positive)]">{formatCurrency(fd.maturityAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Auto Renew</span>
                    <span>{fd.autoRenew ? 'Yes' : 'No'}</span>
                  </div>
                  {fd.notes && <p className="text-sm text-[var(--color-text-muted)] pt-1">{fd.notes}</p>}
                </div>
              }
            />
          );
        })
      )}

      <button className="fab" onClick={() => { setEditItem(null); setShowForm(true); }}>+</button>

      <FormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}
        fields={FIELDS}
        onSubmit={handleSubmit}
        initialData={(editItem as unknown as Record<string, unknown>) ?? undefined}
      />
    </div>
  );
}
