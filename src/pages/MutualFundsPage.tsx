import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import DataCard from '../components/DataCard';
import FormModal from '../components/FormModal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/currency';
import type { MutualFund, FieldConfig } from '../types';

const FIELDS: FieldConfig[] = [
  { name: 'fundName', label: 'Fund Name', type: 'text', required: true, placeholder: 'e.g. HDFC Balanced Advantage' },
  { name: 'amcName', label: 'AMC Name', type: 'text', placeholder: 'e.g. HDFC AMC' },
  { name: 'folioNumber', label: 'Folio Number', type: 'text' },
  { name: 'investedAmount', label: 'Invested Amount (₹)', type: 'number', required: true },
  { name: 'currentValue', label: 'Current Value (₹)', type: 'number', required: true },
  { name: 'category', label: 'Category', type: 'select', required: true,
    options: [
      { value: 'equity', label: 'Equity' },
      { value: 'debt', label: 'Debt' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'elss', label: 'ELSS' },
      { value: 'liquid', label: 'Liquid' },
      { value: 'other', label: 'Other' },
    ]},
  { name: 'sipActive', label: 'SIP Active', type: 'checkbox' },
  { name: 'sipAmount', label: 'SIP Amount (₹/month)', type: 'number' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function MutualFundsPage() {
  const { data, loading, add, update, remove } = useStore<'mutualFunds'>('mutualFunds');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MutualFund | null>(null);

  const mfs = data as MutualFund[];
  const totalInvested = mfs.reduce((s, mf) => s + mf.investedAmount, 0);
  const totalCurrent = mfs.reduce((s, mf) => s + mf.currentValue, 0);
  const gainLoss = totalCurrent - totalInvested;
  const gainLossPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editItem) {
      await update(editItem.id, formData as Partial<MutualFund>);
    } else {
      await add(formData as Omit<MutualFund, 'id' | 'createdAt' | 'updatedAt'>);
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
            <p className="currency font-semibold text-sm">{formatCurrency(totalInvested)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Current Value</p>
            <p className="currency font-semibold text-sm" style={{ color: 'var(--color-gold)' }}>{formatCurrency(totalCurrent)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Gain / Loss</p>
            <p className={`font-semibold text-sm ${gainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {gainLoss >= 0 ? '+' : ''}{gainLossPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">All Mutual Funds</h2>
        <span className="badge badge-navy">{mfs.length}</span>
      </div>

      {mfs.length === 0 ? (
        <EmptyState icon="📈" title="No mutual funds yet" description="Track your mutual fund portfolio here." />
      ) : (
        mfs.map(mf => {
          const gl = mf.currentValue - mf.investedAmount;
          const glPct = mf.investedAmount > 0 ? (gl / mf.investedAmount) * 100 : 0;
          return (
            <DataCard
              key={mf.id}
              title={mf.fundName}
              subtitle={mf.amcName}
              badges={[
                { label: mf.category, variant: 'navy' },
                ...(mf.sipActive ? [{ label: 'SIP Active', variant: 'green' as const }] : []),
              ]}
              rightContent={
                <div className="text-right">
                  <p className="currency font-semibold text-sm">{formatCurrency(mf.currentValue)}</p>
                  <p className={`text-xs font-medium ${gl >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                    {gl >= 0 ? '+' : ''}{glPct.toFixed(1)}%
                  </p>
                </div>
              }
              onEdit={() => { setEditItem(mf); setShowForm(true); }}
              onDelete={() => remove(mf.id)}
              expandedContent={
                <div className="space-y-1.5">
                  {mf.folioNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Folio Number</span>
                      <span className="font-mono">{mf.folioNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Invested</span>
                    <span className="currency">{formatCurrency(mf.investedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Current Value</span>
                    <span className="currency">{formatCurrency(mf.currentValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Gain / Loss</span>
                    <span className={`currency font-medium ${gl >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                      {gl >= 0 ? '+' : ''}{formatCurrency(Math.abs(gl))} ({gl >= 0 ? '+' : ''}{glPct.toFixed(1)}%)
                    </span>
                  </div>
                  {mf.sipActive && mf.sipAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">SIP Amount</span>
                      <span className="currency">{formatCurrency(mf.sipAmount)}/mo</span>
                    </div>
                  )}
                  {mf.notes && <p className="text-sm text-[var(--color-text-muted)] pt-1">{mf.notes}</p>}
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
        title={editItem ? 'Edit Mutual Fund' : 'Add Mutual Fund'}
        fields={FIELDS}
        onSubmit={handleSubmit}
        initialData={(editItem as unknown as Record<string, unknown>) ?? undefined}
      />
    </div>
  );
}
