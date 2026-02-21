import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '../hooks/useStore';
import FormModal from '../components/FormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrency } from '../hooks/useCurrency';
import { formatDate, getMaturityStatus } from '../utils/dates';
import type { FixedDeposit, MutualFund, FieldConfig } from '../types';

const FD_FIELDS: FieldConfig[] = [
  { name: 'bank', label: 'Bank', type: 'text', required: true },
  { name: 'accountName', label: 'Account Holder', type: 'text', required: true },
  { name: 'fdNumber', label: 'FD Number', type: 'text' },
  { name: 'principalAmount', label: 'Principal (₹)', type: 'number', required: true },
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

const MF_FIELDS: FieldConfig[] = [
  { name: 'fundName', label: 'Fund Name', type: 'text', required: true },
  { name: 'amcName', label: 'AMC Name', type: 'text' },
  { name: 'folioNumber', label: 'Folio Number', type: 'text' },
  { name: 'investedAmount', label: 'Invested Amount (₹)', type: 'number', required: true },
  { name: 'currentValue', label: 'Current Value (₹)', type: 'number', required: true },
  { name: 'category', label: 'Category', type: 'select', required: true,
    options: [
      { value: 'equity', label: 'Equity' }, { value: 'debt', label: 'Debt' },
      { value: 'hybrid', label: 'Hybrid' }, { value: 'elss', label: 'ELSS' },
      { value: 'liquid', label: 'Liquid' }, { value: 'other', label: 'Other' },
    ]},
  { name: 'sipActive', label: 'SIP Active', type: 'checkbox' },
  { name: 'sipAmount', label: 'SIP Amount (₹/month)', type: 'number' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function LiquidAssetsPage() {
  const navigate = useNavigate();
  const { data: fdsData, loading: fdLoading, add: addFd } = useStore<'fixedDeposits'>('fixedDeposits');
  const { data: mfsData, loading: mfLoading, add: addMf } = useStore<'mutualFunds'>('mutualFunds');
  const [showFdForm, setShowFdForm] = useState(false);
  const [showMfForm, setShowMfForm] = useState(false);

  const { formatCurrency, formatCurrencyShort } = useCurrency();
  const fds = fdsData as FixedDeposit[];
  const mfs = mfsData as MutualFund[];

  const fdTotal = fds.reduce((s, fd) => s + fd.principalAmount, 0);
  const mfTotal = mfs.reduce((s, mf) => s + mf.currentValue, 0);
  const liquidTotal = fdTotal + mfTotal;

  const chartData = [
    { name: 'Fixed Deposits', value: fdTotal, color: '#C8956C' },
    { name: 'Mutual Funds', value: mfTotal, color: '#2D8B6F' },
  ];

  const STATUS_DOT: Record<string, string> = {
    active: '🟢', maturing: '🟡', matured: '🔴',
  };

  if (fdLoading || mfLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%)' }}>
        <p className="text-white/70 text-sm mb-1">Total Liquid Assets</p>
        <p className="currency-large" style={{ color: 'var(--color-gold)' }}>{formatCurrency(liquidTotal)}</p>
      </div>

      {/* Fixed Deposits Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold">Fixed Deposits</h2>
            <p className="text-sm text-[var(--color-text-muted)] currency">{formatCurrencyShort(fdTotal)}</p>
          </div>
          <button onClick={() => navigate('/liquid/fds')} className="flex items-center gap-1 text-sm text-[var(--color-gold)] font-medium">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {fds.slice(0, 5).map(fd => (
            <div key={fd.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border-light)] last:border-0">
              <div>
                <p className="text-sm font-medium">{fd.bank}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{fd.interestRate}% · {formatDate(fd.maturityDate)}</p>
              </div>
              <div className="text-right">
                <p className="currency text-sm font-semibold">{formatCurrencyShort(fd.principalAmount)}</p>
                <span>{STATUS_DOT[getMaturityStatus(fd.maturityDate)]}</span>
              </div>
            </div>
          ))}
          {fds.length === 0 && <p className="text-sm text-[var(--color-text-muted)] text-center py-2">No FDs yet</p>}
        </div>
        <button
          onClick={() => setShowFdForm(true)}
          className="mt-3 w-full py-2 border border-dashed border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
        >
          + Add FD
        </button>
      </div>

      {/* Mutual Funds Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold">Mutual Funds</h2>
            <p className="text-sm text-[var(--color-text-muted)] currency">{formatCurrencyShort(mfTotal)}</p>
          </div>
          <button onClick={() => navigate('/liquid/mfs')} className="flex items-center gap-1 text-sm text-[var(--color-gold)] font-medium">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {mfs.slice(0, 5).map(mf => {
            const gl = mf.currentValue - mf.investedAmount;
            const glPct = mf.investedAmount > 0 ? (gl / mf.investedAmount * 100).toFixed(1) : '0';
            return (
              <div key={mf.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border-light)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mf.fundName}</p>
                  <span className="badge badge-navy text-xs">{mf.category}</span>
                </div>
                <div className="text-right ml-2">
                  <p className="currency text-sm font-semibold">{formatCurrencyShort(mf.currentValue)}</p>
                  <p className={`text-xs ${gl >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                    {gl >= 0 ? '+' : ''}{glPct}%
                  </p>
                </div>
              </div>
            );
          })}
          {mfs.length === 0 && <p className="text-sm text-[var(--color-text-muted)] text-center py-2">No MFs yet</p>}
        </div>
        <button
          onClick={() => setShowMfForm(true)}
          className="mt-3 w-full py-2 border border-dashed border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
        >
          + Add MF
        </button>
      </div>

      {/* Split Chart */}
      {liquidTotal > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold mb-3">FD vs MF Split</h2>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <FormModal
        open={showFdForm}
        onClose={() => setShowFdForm(false)}
        title="Add Fixed Deposit"
        fields={FD_FIELDS}
        onSubmit={async (d) => { await addFd(d as Omit<FixedDeposit, 'id' | 'createdAt' | 'updatedAt'>); }}
      />
      <FormModal
        open={showMfForm}
        onClose={() => setShowMfForm(false)}
        title="Add Mutual Fund"
        fields={MF_FIELDS}
        onSubmit={async (d) => { await addMf(d as Omit<MutualFund, 'id' | 'createdAt' | 'updatedAt'>); }}
      />
    </div>
  );
}
