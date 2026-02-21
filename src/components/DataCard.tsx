import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface Badge {
  label: string;
  variant: 'navy' | 'gold' | 'green' | 'red' | 'yellow';
}

interface DataCardProps {
  title: string;
  subtitle?: string;
  badges?: Badge[];
  expandedContent?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => Promise<void> | void;
  rightContent?: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
}

const badgeClass: Record<string, string> = {
  navy: 'badge-navy',
  gold: 'badge-gold',
  green: 'badge-green',
  red: 'badge-red',
  yellow: 'badge-yellow',
};

export default function DataCard({
  title,
  subtitle,
  badges,
  expandedContent,
  onEdit,
  onDelete,
  rightContent,
  icon,
  onClick,
}: DataCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleToggle = () => {
    if (onClick) { onClick(); return; }
    if (expandedContent) setExpanded(prev => !prev);
  };

  return (
    <>
      <div className="card card-tappable animate-in" onClick={handleToggle}>
        <div className="flex items-start gap-3">
          {icon && <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--color-text)] truncate">{title}</h3>
                {subtitle && <p className="text-sm text-[var(--color-text-muted)] mt-0.5 truncate">{subtitle}</p>}
                {badges && badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {badges.map((b, i) => (
                      <span key={i} className={`badge ${badgeClass[b.variant]}`}>{b.label}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {rightContent && <div className="text-right">{rightContent}</div>}
                {expandedContent && !onClick && (
                  <div className="text-[var(--color-text-muted)]">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {expanded && expandedContent && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]" onClick={e => e.stopPropagation()}>
            {expandedContent}
            <div className="flex gap-2 mt-4">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-navy)] text-white text-sm font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={async () => { await onDelete?.(); }}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
