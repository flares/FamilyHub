import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import FormModal from '../components/FormModal';
import EmptyState from '../components/EmptyState';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrency } from '../hooks/useCurrency';
import { formatDate } from '../utils/dates';
import type { RetirementItem, FieldConfig } from '../types';

const FIELDS: FieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Collect Gratuity' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'category', label: 'Category', type: 'select', required: true,
    options: [
      { value: 'pension', label: 'Pension' },
      { value: 'gratuity', label: 'Gratuity' },
      { value: 'pf', label: 'Provident Fund' },
      { value: 'leave_encashment', label: 'Leave Encashment' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'tax', label: 'Tax Related' },
      { value: 'other', label: 'Other' },
    ]},
  { name: 'expectedAmount', label: 'Expected Amount (₹)', type: 'number' },
  { name: 'deadline', label: 'Deadline', type: 'date' },
  { name: 'priority', label: 'Priority', type: 'select', required: true,
    options: [
      { value: 'high', label: '⚡ High' },
      { value: 'medium', label: '🔵 Medium' },
      { value: 'low', label: '⬜ Low' },
    ]},
  { name: 'status', label: 'Status', type: 'select',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
    ]},
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const PRESETS = [
  { title: 'Collect Gratuity', category: 'gratuity' },
  { title: 'Collect Provident Fund', category: 'pf' },
  { title: 'Leave Encashment', category: 'leave_encashment' },
  { title: 'Setup Pension', category: 'pension' },
  { title: 'File Final Tax Return', category: 'tax' },
  { title: 'Transfer Salary Account', category: 'other' },
  { title: 'Update All Nominees', category: 'other' },
  { title: 'Collect Service Certificate', category: 'other' },
  { title: 'Health Insurance Continuation', category: 'insurance' },
  { title: 'Superannuation Settlement', category: 'other' },
  { title: 'Group Insurance Claim', category: 'insurance' },
  { title: 'KYC Updates Everywhere', category: 'other' },
];

const PRIORITY_ICON: Record<string, string> = { high: '⚡', medium: '🔵', low: '⬜' };
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function SectionHeader({ title, count, expanded, onToggle }: {
  title: string; count: number; expanded: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-2 text-left">
      <span className="font-semibold text-sm text-[var(--color-text-muted)]">{title} ({count})</span>
      {expanded ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />}
    </button>
  );
}

export default function RetirementTrackerPage() {
  const { data, loading, add, update, remove } = useStore<'retirementItems'>('retirementItems');
  const [showForm, setShowForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [editItem, setEditItem] = useState<RetirementItem | null>(null);
  const [presetData, setPresetData] = useState<Partial<RetirementItem> | null>(null);
  const [pendingExpanded, setPendingExpanded] = useState(true);
  const [inProgressExpanded, setInProgressExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const { formatCurrency } = useCurrency();
  const items = data as RetirementItem[];
  const completed = items.filter(i => i.status === 'completed');
  const inProgress = items.filter(i => i.status === 'in_progress')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const pending = items.filter(i => i.status === 'pending')
    .sort((a, b) => {
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pd !== 0) return pd;
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  const totalExpected = items.reduce((s, i) => s + (i.expectedAmount || 0), 0);
  const collectedAmount = completed.reduce((s, i) => s + (i.expectedAmount || 0), 0);

  const cycleStatus = async (item: RetirementItem) => {
    if (item.status === 'pending') {
      await update(item.id, { status: 'in_progress' });
    } else if (item.status === 'in_progress') {
      await update(item.id, { status: 'completed', completedAt: new Date().toISOString() });
    } else {
      await update(item.id, { status: 'pending', completedAt: null });
    }
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editItem) {
      await update(editItem.id, formData as Partial<RetirementItem>);
    } else {
      await add({
        ...formData,
        completedAt: null,
      } as Omit<RetirementItem, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setEditItem(null);
    setPresetData(null);
  };

  const handlePreset = (preset: { title: string; category: string }) => {
    setPresetData({ title: preset.title, category: preset.category as RetirementItem['category'], priority: 'medium', status: 'pending' });
    setShowPresets(false);
    setShowForm(true);
  };

  const CheckButton = ({ item }: { item: RetirementItem }) => {
    const symbols: Record<string, string> = { pending: '○', in_progress: '◑', completed: '✓' };
    const colors: Record<string, string> = {
      pending: 'text-[var(--color-text-muted)] border-[var(--color-border)]',
      in_progress: 'text-[var(--color-warning)] border-[var(--color-warning)]',
      completed: 'text-white bg-[var(--color-positive)] border-[var(--color-positive)]',
    };
    return (
      <button
        onClick={() => cycleStatus(item)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors[item.status]}`}
      >
        {symbols[item.status]}
      </button>
    );
  };

  const ItemCard = ({ item }: { item: RetirementItem }) => (
    <div className="card flex items-start gap-3">
      <CheckButton item={item} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span>{PRIORITY_ICON[item.priority]}</span>
          <p className={`text-sm font-medium ${item.status === 'completed' ? 'line-through text-[var(--color-text-muted)]' : ''}`}>
            {item.title}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          <span className="badge badge-navy text-xs">{item.category.replace('_', ' ')}</span>
          {item.deadline && (
            <span className="badge badge-yellow text-xs">Due: {formatDate(item.deadline)}</span>
          )}
          {item.expectedAmount > 0 && (
            <span className="badge badge-green text-xs currency">{formatCurrency(item.expectedAmount)}</span>
          )}
          {item.completedAt && (
            <span className="badge badge-green text-xs">Done: {formatDate(item.completedAt)}</span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{item.description}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <button onClick={() => { setEditItem(item); setShowForm(true); }} className="text-[var(--color-text-muted)] hover:text-[var(--color-navy)] text-xs px-1">
          ✎
        </button>
        <button onClick={() => remove(item.id)} className="text-[var(--color-danger)] hover:opacity-70 text-xs px-1">
          ✕
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="card">
        <h2 className="text-base font-semibold mb-1">Retirement Progress</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          {completed.length} of {items.length} completed · {formatCurrency(collectedAmount)} collected
        </p>
        <ProgressBar value={completed.length} max={items.length || 1} />
        {totalExpected > 0 && (
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Expected total: {formatCurrency(totalExpected)}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No retirement items"
          description="Track all your retirement benefits and action items."
        />
      ) : (
        <>
          {/* Pending */}
          <div>
            <SectionHeader title="📋 Pending" count={pending.length} expanded={pendingExpanded} onToggle={() => setPendingExpanded(p => !p)} />
            {pendingExpanded && <div className="space-y-2">{pending.map(i => <ItemCard key={i.id} item={i} />)}</div>}
          </div>

          {/* In Progress */}
          <div>
            <SectionHeader title="🔄 In Progress" count={inProgress.length} expanded={inProgressExpanded} onToggle={() => setInProgressExpanded(p => !p)} />
            {inProgressExpanded && <div className="space-y-2">{inProgress.map(i => <ItemCard key={i.id} item={i} />)}</div>}
          </div>

          {/* Completed */}
          <div>
            <SectionHeader title="✅ Completed" count={completed.length} expanded={completedExpanded} onToggle={() => setCompletedExpanded(p => !p)} />
            {completedExpanded && <div className="space-y-2">{completed.map(i => <ItemCard key={i.id} item={i} />)}</div>}
          </div>
        </>
      )}

      {/* FAB with presets */}
      <div className="fixed bottom-20 right-5 flex flex-col items-end gap-2 z-40">
        {showPresets && (
          <div className="card shadow-lg max-h-64 overflow-y-auto w-64">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">Quick Add Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.title}
                  onClick={() => handlePreset(p)}
                  className="text-xs px-2 py-1 rounded-full bg-[var(--color-border-light)] text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowPresets(false); setShowForm(true); }}
              className="mt-2 w-full py-1.5 text-xs text-[var(--color-gold)] font-medium border border-[var(--color-gold)] rounded-lg"
            >
              Custom Item
            </button>
          </div>
        )}
        <button className="fab" style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          onClick={() => setShowPresets(p => !p)}>
          {showPresets ? '×' : '+'}
        </button>
      </div>

      <FormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); setPresetData(null); }}
        title={editItem ? 'Edit Item' : 'Add Retirement Item'}
        fields={FIELDS}
        onSubmit={handleSubmit}
        initialData={(editItem as unknown as Record<string, unknown>) ?? (presetData as unknown as Record<string, unknown>) ?? undefined}
      />
    </div>
  );
}
