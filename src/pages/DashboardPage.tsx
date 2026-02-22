import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Droplets, Home, Target, CreditCard, ChevronRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useCurrency } from '../hooks/useCurrency';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import type { FixedDeposit, MutualFund, Property, RetirementItem } from '../types';

const COLORS = { fd: '#C8956C', mf: '#2D8B6F', property: '#1B2A4A' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const { formatCurrency, formatCurrencyShort, isHidden } = useCurrency();
  const { data: fds } = useStore<'fixedDeposits'>('fixedDeposits');
  const { data: mfs } = useStore<'mutualFunds'>('mutualFunds');
  const { data: properties } = useStore<'properties'>('properties');
  const { data: retirementItems } = useStore<'retirementItems'>('retirementItems');

  const fdTotal = (fds as FixedDeposit[]).reduce((s, fd) => s + fd.principalAmount, 0);
  const mfTotal = (mfs as MutualFund[]).reduce((s, mf) => s + mf.currentValue, 0);
  const liquidTotal = fdTotal + mfTotal;
  const illiquidTotal = (properties as Property[]).reduce((s, p) => s + p.estimatedValue, 0);
  const netWorth = liquidTotal + illiquidTotal;

  const completedRetirement = (retirementItems as RetirementItem[]).filter(i => i.status === 'completed').length;
  const totalRetirement = retirementItems.length;
  const collectedAmount = (retirementItems as RetirementItem[])
    .filter(i => i.status === 'completed')
    .reduce((s, i) => s + (i.expectedAmount || 0), 0);

  const nextPending = (retirementItems as RetirementItem[])
    .filter(i => i.status === 'pending')
    .sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    })[0];

  const houseCount = (properties as Property[]).filter(p => p.type === 'house').length;
  const landCount = (properties as Property[]).filter(p => p.type === 'land').length;

  const chartData = [
    { name: 'Fixed Deposits', value: fdTotal, color: COLORS.fd },
    { name: 'Mutual Funds', value: mfTotal, color: COLORS.mf },
    { name: 'Properties', value: illiquidTotal, color: COLORS.property },
  ].filter(d => d.value > 0);

  const quickLinks = [
    { icon: <CreditCard className="w-5 h-5" />, label: 'Bank Accounts', to: '/bank-accounts' },
    { icon: <span className="text-xl">🪪</span>, label: 'IDs & Cards', to: '/ids-cards' },
  ];

  return (
    <div className="space-y-4">
      {/* Liquid Assets hero */}
      <div
        className="rounded-2xl p-5 cursor-pointer active:scale-[0.98] transition-transform select-none"
        style={{ background: 'linear-gradient(135deg, #1B3A4A 0%, #2D8B6F 100%)' }}
        onClick={() => navigate('/liquid')}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-white/70" />
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Liquid Assets</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </div>
        <p className="text-white text-2xl font-bold mb-3">{formatCurrency(liquidTotal)}</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/60 text-xs mb-0.5">Fixed Deposits</p>
            <p className="font-semibold text-sm" style={{ color: '#C8956C' }}>{formatCurrency(fdTotal)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/60 text-xs mb-0.5">Mutual Funds</p>
            <p className="font-semibold text-sm" style={{ color: '#7ED4B8' }}>{formatCurrency(mfTotal)}</p>
          </div>
        </div>
      </div>

      {/* Illiquid Assets hero */}
      <div
        className="rounded-2xl p-5 cursor-pointer active:scale-[0.98] transition-transform select-none"
        style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #7C4A1E 100%)' }}
        onClick={() => navigate('/illiquid')}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-white/70" />
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Illiquid Assets</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </div>
        <p className="text-white text-2xl font-bold mb-3">{formatCurrency(illiquidTotal)}</p>
        <div className="flex flex-wrap gap-2">
          {houseCount > 0 && (
            <span className="bg-white/10 rounded-xl px-3 py-1.5 text-white/80 text-xs font-medium">
              🏠 {houseCount} House{houseCount > 1 ? 's' : ''}
            </span>
          )}
          {landCount > 0 && (
            <span className="bg-white/10 rounded-xl px-3 py-1.5 text-white/80 text-xs font-medium">
              🌾 {landCount} Land parcel{landCount > 1 ? 's' : ''}
            </span>
          )}
          {houseCount === 0 && landCount === 0 && (
            <span className="text-white/40 text-xs">No properties yet</span>
          )}
        </div>
      </div>

      {/* Retirement Progress */}
      <div className="card card-tappable" onClick={() => navigate('/retirement')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--color-gold)]" />
            <h2 className="text-base font-semibold">Retirement Progress</h2>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
        </div>
        {totalRetirement === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Start tracking retirement →</p>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-muted)] mb-2">
              {completedRetirement} of {totalRetirement} completed · {formatCurrencyShort(collectedAmount)} collected
            </p>
            <ProgressBar value={completedRetirement} max={totalRetirement} />
            {nextPending && (
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Next: {nextPending.title}
              </p>
            )}
          </>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(link => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className="card flex flex-col items-center gap-2 py-4 card-tappable"
            >
              <span className="text-[var(--color-navy)]">{link.icon}</span>
              <span className="text-xs font-medium text-center">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Asset Breakdown — bottom */}
      <div className="card">
        <h2 className="text-base font-semibold mb-3">Asset Breakdown</h2>
        {chartData.length === 0 ? (
          <EmptyState title="No assets yet" description="Add FDs, MFs or properties to see breakdown." />
        ) : isHidden ? (
          <p className="text-sm text-center text-[var(--color-text-muted)] py-6">Numbers hidden</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend
                formatter={(value, entry) => {
                  const item = chartData.find(d => d.name === value);
                  const pct = netWorth > 0 ? ((item?.value || 0) / netWorth * 100).toFixed(0) : '0';
                  return `${value}: ${formatCurrencyShort(entry.payload?.value || 0)} (${pct}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
