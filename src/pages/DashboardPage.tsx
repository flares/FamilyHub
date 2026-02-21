import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Droplets, Home, Target, CreditCard, FolderOpen, Settings, ChevronRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { formatCurrency, formatCurrencyShort } from '../utils/currency';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import type { FixedDeposit, MutualFund, Property, RetirementItem } from '../types';

const COLORS = { fd: '#C8956C', mf: '#2D8B6F', property: '#1B2A4A' };

export default function DashboardPage() {
  const navigate = useNavigate();
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
    { icon: <FolderOpen className="w-5 h-5" />, label: 'Documents', to: '/documents' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="space-y-4">
      {/* Net Worth Hero Card */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%)' }}
      >
        <p className="text-white/70 text-sm font-medium mb-2">Total Net Worth</p>
        <p className="currency-hero" style={{ color: 'var(--color-gold)' }}>
          {formatCurrency(netWorth)}
        </p>
      </div>

      {/* Liquid + Illiquid Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card card-tappable card-gold-accent" onClick={() => navigate('/liquid')}>
          <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)]">
            <Droplets className="w-4 h-4" />
            <span className="text-xs font-medium">Liquid Assets</span>
          </div>
          <p className="currency font-semibold text-lg">{formatCurrency(liquidTotal)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            FDs: {formatCurrencyShort(fdTotal)} · MFs: {formatCurrencyShort(mfTotal)}
          </p>
          <div className="flex items-center gap-1 mt-3 text-xs text-[var(--color-gold)] font-medium">
            <span>View Details</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        <div className="card card-tappable card-gold-accent" onClick={() => navigate('/illiquid')}>
          <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)]">
            <Home className="w-4 h-4" />
            <span className="text-xs font-medium">Illiquid Assets</span>
          </div>
          <p className="currency font-semibold text-lg">{formatCurrency(illiquidTotal)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {houseCount > 0 ? `${houseCount} House${houseCount > 1 ? 's' : ''}` : ''}
            {houseCount > 0 && landCount > 0 ? ' · ' : ''}
            {landCount > 0 ? `${landCount} Land` : ''}
            {houseCount === 0 && landCount === 0 ? 'No properties' : ''}
          </p>
          <div className="flex items-center gap-1 mt-3 text-xs text-[var(--color-gold)] font-medium">
            <span>View Details</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Asset Breakdown Chart */}
      <div className="card">
        <h2 className="text-base font-semibold mb-3">Asset Breakdown</h2>
        {chartData.length === 0 ? (
          <EmptyState title="No assets yet" description="Add FDs, MFs or properties to see breakdown." />
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
        <div className="flex gap-3 overflow-x-auto pb-2">
          {quickLinks.map(link => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className="flex-shrink-0 card flex flex-col items-center gap-2 px-4 py-3 min-w-[80px] card-tappable"
            >
              <span className="text-[var(--color-navy)]">{link.icon}</span>
              <span className="text-xs font-medium text-center">{link.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
