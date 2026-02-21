import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
}

export default function StatCard({ label, value, sub, icon, variant = 'default' }: StatCardProps) {
  const valueColor =
    variant === 'positive' ? 'text-[var(--color-positive)]' :
    variant === 'negative' ? 'text-[var(--color-danger)]' :
    variant === 'warning' ? 'text-[var(--color-warning)]' :
    'text-[var(--color-text)]';

  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>
      <div className={`currency text-xl font-semibold ${valueColor}`}>{value}</div>
      {sub && <div className="text-xs text-[var(--color-text-muted)]">{sub}</div>}
    </div>
  );
}
